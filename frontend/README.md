# Frontend — Atlas países

Interfaz web desarrollada con HTML, CSS, JavaScript y Vite. Consume la API REST de países mediante Fetch API.

## Requisitos

- Node.js 18 o superior
- Backend iniciado en `http://localhost:3000`

## Instalación y ejecución

Desde esta carpeta:

```bash
npm install
npm run dev
```

Vite mostrará la dirección del frontend, normalmente `http://localhost:5173`.

La URL de la API se puede cambiar creando un archivo `.env` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Funcionalidades

- Listado dinámico de países (`GET /countries`).
- Búsqueda local por nombre, códigos y continente.
- Creación (`POST /countries`) y edición completa (`PUT /countries/:id`).
- Validaciones en el navegador antes de enviar los datos.
- Eliminación (`DELETE /countries/:id`) con confirmación.
- Mensajes de éxito/error según el estado HTTP.
- Indicadores de total de países, continentes y población.
