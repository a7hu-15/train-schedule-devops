import logging
from app.events.schemas import EventEnvelope
from app.events.registry import EVENT_REGISTRY

from app.system.logger import log_event
from app.system.metrics import increment_event_received, increment_event_processed, increment_event_failed, record_processing_latency
from app.system.storage import save_event
import time

logger = logging.getLogger(__name__)

class EventDispatcher:
    """
    Central router for the Event Processing Pipeline.
    Knows nothing about railway logic. Only routes events to registered processors.
    """

    def dispatch(self, event: EventEnvelope):
        """
        Routes the event to its processors.
        Any new events returned by the processors are immediately dispatched (Event Chaining).
        """
        increment_event_received(event.type)
        log_event(event, "RECEIVED")
        save_event(event, "RECEIVED")
        
        processors = EVENT_REGISTRY.get(event.type, [])
        if not processors:
            logger.warning(f"No processor registered for event type: {event.type}")
            log_event(event, "FAILED")
            save_event(event, "FAILED")
            increment_event_failed(event.type)
            return

        log_event(event, "DISPATCHED")
        save_event(event, "DISPATCHED")

        for processor in processors:
            try:
                start_time = time.time()
                # Processors return a list of new events to be chained (Rule 2: Processors are Pure)
                new_events = processor(event)
                duration_ms = (time.time() - start_time) * 1000
                
                log_event(event, "PROCESSED")
                increment_event_processed(event.type)
                log_event(event, "COMPLETED")
                save_event(event, "COMPLETED", duration_ms)
                record_processing_latency(event.type, duration_ms / 1000)

                
                # Event Chaining
                if new_events:
                    for new_event in new_events:
                        # Rule 4: Traceability. Pass correlation_id and parent_event_id
                        new_event.correlation_id = event.correlation_id
                        new_event.parent_event_id = event.event_id
                        self.dispatch(new_event)
                        
            except Exception as e:
                logger.error(f"Processor {processor.__name__} failed for event {event.event_id}: {str(e)}")
                log_event(event, "FAILED")
                save_event(event, "FAILED")
                increment_event_failed(event.type)

dispatcher = EventDispatcher()
