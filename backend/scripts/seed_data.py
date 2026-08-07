import logging
from sqlalchemy.orm import Session
from app.db import models

logger = logging.getLogger("railpulse.seed")

SAMPLE_TRAINS = [
    {
        "train_number": "12951",
        "name": "Mumbai Rajdhani Express",
        "source_station_code": "MMCT",
        "destination_station_code": "NDLS",
        "runs_on": "DAILY",
        "stops": [
            {"station_code": "MMCT", "station_name": "Mumbai Central", "sequence": 1, "scheduled_arrival": "17:00", "scheduled_departure": "17:00", "distance_km": 0, "day_offset": 0},
            {"station_code": "BVI", "station_name": "Borivali", "sequence": 2, "scheduled_arrival": "17:22", "scheduled_departure": "17:24", "distance_km": 30, "day_offset": 0},
            {"station_code": "ST", "station_name": "Surat", "sequence": 3, "scheduled_arrival": "19:43", "scheduled_departure": "19:48", "distance_km": 263, "day_offset": 0},
            {"station_code": "BRC", "station_name": "Vadodara Junction", "sequence": 4, "scheduled_arrival": "21:06", "scheduled_departure": "21:16", "distance_km": 393, "day_offset": 0},
            {"station_code": "RTM", "station_name": "Ratlam Junction", "sequence": 5, "scheduled_arrival": "00:05", "scheduled_departure": "00:08", "distance_km": 653, "day_offset": 1},
            {"station_code": "KOTA", "station_name": "Kota Junction", "sequence": 6, "scheduled_arrival": "03:05", "scheduled_departure": "03:15", "distance_km": 920, "day_offset": 1},
            {"station_code": "NDLS", "station_name": "New Delhi", "sequence": 7, "scheduled_arrival": "08:32", "scheduled_departure": "08:32", "distance_km": 1386, "day_offset": 1},
        ]
    },
    {
        "train_number": "12002",
        "name": "Bhopal Shatabdi Express",
        "source_station_code": "NDLS",
        "destination_station_code": "RKMP",
        "runs_on": "DAILY",
        "stops": [
            {"station_code": "NDLS", "station_name": "New Delhi", "sequence": 1, "scheduled_arrival": "06:00", "scheduled_departure": "06:00", "distance_km": 0, "day_offset": 0},
            {"station_code": "MTJ", "station_name": "Mathura Junction", "sequence": 2, "scheduled_arrival": "07:19", "scheduled_departure": "07:20", "distance_km": 141, "day_offset": 0},
            {"station_code": "AGC", "station_name": "Agra Cantt", "sequence": 3, "scheduled_arrival": "07:50", "scheduled_departure": "07:55", "distance_km": 195, "day_offset": 0},
            {"station_code": "GWL", "station_name": "Gwalior Junction", "sequence": 4, "scheduled_arrival": "09:23", "scheduled_departure": "09:28", "distance_km": 313, "day_offset": 0},
            {"station_code": "VGLJ", "station_name": "VGL Jhansi Junction", "sequence": 5, "scheduled_arrival": "10:45", "scheduled_departure": "10:50", "distance_km": 410, "day_offset": 0},
            {"station_code": "BPL", "station_name": "Bhopal Junction", "sequence": 6, "scheduled_arrival": "14:07", "scheduled_departure": "14:12", "distance_km": 702, "day_offset": 0},
            {"station_code": "RKMP", "station_name": "Rani Kamlapati", "sequence": 7, "scheduled_arrival": "14:40", "scheduled_departure": "14:40", "distance_km": 709, "day_offset": 0},
        ]
    },
    {
        "train_number": "22436",
        "name": "Vande Bharat Express",
        "source_station_code": "NDLS",
        "destination_station_code": "BSB",
        "runs_on": "SUN,MON,TUE,WED,FRI,SAT",
        "stops": [
            {"station_code": "NDLS", "station_name": "New Delhi", "sequence": 1, "scheduled_arrival": "06:00", "scheduled_departure": "06:00", "distance_km": 0, "day_offset": 0},
            {"station_code": "CNB", "station_name": "Kanpur Central", "sequence": 2, "scheduled_arrival": "10:08", "scheduled_departure": "10:10", "distance_km": 440, "day_offset": 0},
            {"station_code": "PRYJ", "station_name": "Prayagraj Junction", "sequence": 3, "scheduled_arrival": "12:08", "scheduled_departure": "12:10", "distance_km": 634, "day_offset": 0},
            {"station_code": "BSB", "station_name": "Varanasi Junction", "sequence": 4, "scheduled_arrival": "14:00", "scheduled_departure": "14:00", "distance_km": 759, "day_offset": 0},
        ]
    },
    {
        "train_number": "12626",
        "name": "Kerala Express",
        "source_station_code": "NDLS",
        "destination_station_code": "TVC",
        "runs_on": "DAILY",
        "stops": [
            {"station_code": "NDLS", "station_name": "New Delhi", "sequence": 1, "scheduled_arrival": "20:10", "scheduled_departure": "20:10", "distance_km": 0, "day_offset": 0},
            {"station_code": "AGC", "station_name": "Agra Cantt", "sequence": 2, "scheduled_arrival": "22:20", "scheduled_departure": "22:25", "distance_km": 195, "day_offset": 0},
            {"station_code": "NGP", "station_name": "Nagpur Junction", "sequence": 3, "scheduled_arrival": "10:20", "scheduled_departure": "10:25", "distance_km": 1094, "day_offset": 1},
            {"station_code": "BZA", "station_name": "Vijayawada Junction", "sequence": 4, "scheduled_arrival": "20:30", "scheduled_departure": "20:40", "distance_km": 1761, "day_offset": 1},
            {"station_code": "MAS", "station_name": "MGR Chennai Central", "sequence": 5, "scheduled_arrival": "04:15", "scheduled_departure": "04:40", "distance_km": 2192, "day_offset": 2},
            {"station_code": "TVC", "station_name": "Thiruvananthapuram Central", "sequence": 6, "scheduled_arrival": "18:00", "scheduled_departure": "18:00", "distance_km": 3035, "day_offset": 2},
        ]
    },
    {
        "train_number": "12259",
        "name": "Sealdah Duronto Express",
        "source_station_code": "SDAH",
        "destination_station_code": "NDLS",
        "runs_on": "SUN,MON,WED,THU",
        "stops": [
            {"station_code": "SDAH", "station_name": "Sealdah", "sequence": 1, "scheduled_arrival": "18:30", "scheduled_departure": "18:30", "distance_km": 0, "day_offset": 0},
            {"station_code": "DHN", "station_name": "Dhanbad Junction", "sequence": 2, "scheduled_arrival": "21:55", "scheduled_departure": "22:00", "distance_km": 266, "day_offset": 0},
            {"station_code": "DDU", "station_name": "Pt. DD Upadhyaya Junction", "sequence": 3, "scheduled_arrival": "01:25", "scheduled_departure": "01:35", "distance_km": 568, "day_offset": 1},
            {"station_code": "CNB", "station_name": "Kanpur Central", "sequence": 4, "scheduled_arrival": "05:40", "scheduled_departure": "05:45", "distance_km": 1016, "day_offset": 1},
            {"station_code": "NDLS", "station_name": "New Delhi", "sequence": 5, "scheduled_arrival": "11:00", "scheduled_departure": "11:00", "distance_km": 1452, "day_offset": 1},
        ]
    }
]

def seed_database(db: Session):
    existing_count = db.query(models.Train).count()
    if existing_count > 0:
        logger.info(f"Database already contains {existing_count} trains. Skipping seed.")
        return

    logger.info("Seeding database with sample Indian trains...")
    for train_data in SAMPLE_TRAINS:
        stops_data = train_data.pop("stops")
        train = models.Train(**train_data)
        db.add(train)
        db.flush()

        for stop_info in stops_data:
            stop = models.TrainStop(train_id=train.id, **stop_info)
            db.add(stop)

    db.commit()
    logger.info("Successfully seeded database.")
