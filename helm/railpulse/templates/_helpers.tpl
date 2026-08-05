{{/*
Expand the name of the chart.
*/}}
{{- define "railpulse.fullname" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}
