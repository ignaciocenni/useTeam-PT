# N8N Setup Instructions

## Requisitos

- Docker instalado
- Puerto 5678 disponible

## Instalación

### 1. Levantar N8N

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest
```
