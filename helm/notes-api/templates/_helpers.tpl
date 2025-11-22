{{- define "notes-api.name" -}}
{{ .Chart.Name }}
{{- end }}

{{- define "notes-api.fullname" -}}
{{ .Release.Name }}-{{ .Chart.Name }}
{{- end }}

{{- define "notes-api.labels" -}}
app.kubernetes.io/name: {{ include "notes-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app: {{ include "notes-api.name" . }}
{{- end }}

{{- define "notes-api.selectorLabels" -}}
app: {{ include "notes-api.name" . }}
{{- end }}
