# :test_tube: Prueba Técnica – Tablero Kanban Colaborativo en Tiempo Real

## :dart: Objetivo

Desarrollar una aplicación tipo **Trello** que permita la gestión de tareas mediante un **tablero Kanban** con soporte para **colaboración en tiempo real**. El sistema debe incluir columnas personalizables, tarjetas movibles y funcionalidad de drag & drop fluida.

---

## :gear: Tecnologías Requeridas

### Frontend

- **React.js** para la construcción de la interfaz.
- Implementación de **drag & drop** para mover tarjetas entre columnas.

### Backend

- **NestJS** con soporte de **WebSocket** para simular la colaboración en tiempo real.
- Uso de **MongoDB** para el almacenamiento de datos.
- Implementación de **Socket.io** para comunicación bidireccional.
- **Notificaciones en tiempo real** para reflejar los cambios realizados por otros usuarios.

---

## :mailbox: Funcionalidad Adicional Requerida

### Exportación de Backlog vía Email en CSV

Implementar un sistema de exportación automatizada del backlog del tablero Kanban utilizando **N8N** para generar flujos de trabajo automatizados.

#### :gear: Tecnologías Adicionales

- **N8N** para automatización de flujos de trabajo
- **Webhooks** para comunicación entre sistemas
- **CSV Generation** para estructuración de datos
- **Email Service** para envío de reportes

#### :dart: Requisitos de la Funcionalidad

1. **Trigger desde Frontend**: Botón de exportación en la interfaz del tablero
2. **Endpoint de Exportación**: API en NestJS que dispare el flujo N8N
3. **Flujo N8N Automatizado**:
   - Extracción de datos del tablero Kanban
   - Estructuración de datos en formato CSV
   - Envío automático por email
4. **Configuración de Exportación**:
   - Email destino configurable
   - Selección de campos a exportar (Opcional)
5. **Notificaciones de Estado**:
   - Confirmación de solicitud de exportación
   - Notificación de envío exitoso/fallido

#### :file_folder: Estructura del CSV de Exportación

El archivo CSV exportado debe incluir:

- **ID de tarea** (identificador único)
- **Título** (nombre de la tarea)
- **Descripción** (detalles de la tarea)
- **Columna** (posición actual en el tablero)
- **Fecha de creación** (timestamp de creación)

#### :arrow_forward: Flujo de Trabajo

```
[Frontend] → [NestJS API] → [N8N Webhook] → [Data Extraction] → [CSV Generation] → [Email Delivery] → [User Notification]
```

1. Usuario hace clic en "Exportar Backlog"
2. Frontend envía solicitud a endpoint `/api/export/backlog`
3. NestJS dispara webhook a N8N
4. N8N extrae datos del tablero Kanban
5. N8N estructura datos en formato CSV
6. N8N envía email con archivo CSV adjunto
7. Sistema notifica al usuario el estado de la exportación

---

## :package: Forma de Entrega

### :fork_and_knife: Fork del Repositorio

1. **Fork** este repositorio a tu cuenta de GitHub
2. **Clona** tu fork localmente
3. **Desarrolla** la solución completa en tu fork
4. **Sube** todos los cambios a tu repositorio

### :file_folder: Estructura de Archivos Requerida

```
useTeam-PT/
├── README.md
├── .env.example
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
├── backend/
│   ├── package.json
│   ├── src/
│   └── ...
├── n8n/
│   ├── workflow.json
│   └── setup-instructions.md
└── docker-compose.yml (Opcional)
```

### :gear: Archivos de Configuración

#### `.env.example`

Debe incluir todas las variables de entorno necesarias:

```env examle
# Database
MONGODB_URI=mongodb://localhost:27017/kanban-board

# Backend
PORT=3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kanban-export

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000
```

#### `n8n/workflow.json`

Archivo JSON del flujo de N8N para exportación de backlog.

#### `n8n/setup-instructions.md`

Instrucciones detalladas para configurar y ejecutar el flujo N8N.

### :whale: Docker Compose (Opcional)

Incluir archivo `docker-compose.yml` con:

- Servicio de MongoDB
- Servicio de N8N (versión 1.106.3)
- Configuración de redes y volúmenes

### :rocket: Comando para N8N

Comando para levantar una instancia local de N8N

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest
```

### :memo: Documentación Adicional

- **README.md** actualizado con instrucciones de instalación y ejecución
- **Comentarios en código** explicando la lógica compleja

### :lock: Finalización de la Prueba

Una vez finalizada la implementación:

1. **Invitar** a los siguientes usuarios como colaboradores al repositorio:

   - `rodriguezibrahin3@gmail.com`
   - `jonnahuel78@gmail.com`
   - `administracion@useteam.io`

2. **NO realizar más commits** después de invitar a los usuarios

---

## :brain: Evaluación

Durante el desarrollo de esta prueba se evaluarán:

- **Pensamiento asincrónico** y manejo de procesos en tiempo real.
- **Lógica compleja en el frontend**, especialmente en la interacción y estado compartido.
- Gestión adecuada de **eventos y sincronización** entre múltiples usuarios.

---

## :pushpin: Recomendaciones

- Enfócate en una buena experiencia de usuario (UX).
- Prioriza un código limpio, modular y mantenible.
- Usa comentarios breves y precisos donde la lógica sea compleja.

---

¡Buena suerte! :rocket:
