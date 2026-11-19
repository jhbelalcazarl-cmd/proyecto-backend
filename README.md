# API REST de países del mundo

Aplicación web para administrar países. Incluye un backend REST con Node.js, Express y SQLite, y un frontend independiente con HTML, CSS, JavaScript y Vite. El backend conserva la arquitectura por capas: rutas → controladores → servicios → repositorios.

## Requisitos

- Node.js 18 o superior
- npm

## Configuración y ejecución

La aplicación se ejecuta con **dos terminales**, una para el backend y otra para el frontend.

### Terminal 1 — Backend

Desde la carpeta raíz `proyecto-backend/`:

```bash
npm install
npm run dev
```

La API queda disponible en `http://localhost:3000`.

### Terminal 2 — Frontend

Desde `proyecto-backend/frontend/`:

```bash
npm install
npm run dev
```

Abre en el navegador la dirección que indique Vite, normalmente `http://localhost:5173`. El frontend consume `http://localhost:3000/api/countries`.

Si necesitas cambiar la URL de la API, crea `frontend/.env` usando `frontend/.env.example` como referencia y configura `VITE_API_URL`.

 Al arrancar, crea automáticamente `data/app.db`, crea las tablas y ejecuta los scripts SQL de `src/db/migrations/` una sola vez por versión. La variable `DB_FILE` en `.env` permite cambiar la ruta de la base de datos.

> El script inicial contiene una selección de países de ejemplo para que la API se pueda probar de inmediato. Las poblaciones son aproximadas y no deben tratarse como cifras oficiales exactas. Para cubrir todos los países reconocidos, amplíe `002_seed_countries.sql` con la fuente de datos que exija su curso.

## Entidad: Country (país)

Representa un país con código ISO Alfa-2, código ISO Alfa-3, código numérico ISO de tres dígitos, nombre, continente y población aproximada. El código Alfa-2 es la clave primaria y se usa como `:id`.

## Arquitectura

```text
proyecto-backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── db/
│   │   ├── database.js
│   │   └── migrations/
│   │       ├── 001_initial.sql
│   │       └── 002_seed_countries.sql
│   ├── routes/countries.routes.js
│   ├── controllers/countries.controller.js
│   ├── services/countries.service.js
│   └── repositories/countries.repository.js
├── frontend/              # interfaz web independiente (Vite)
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.js
│       └── style.css
├── data/                  # se crea automáticamente
├── .env
└── package.json
```

- **Rutas:** asignan método y URL al controlador.
- **Controladores:** traducen solicitudes HTTP a respuestas y códigos de estado.
- **Servicios:** validan campos, formatos, población y unicidad antes de ejecutar escrituras en la base de datos.
- **Repositorios:** contienen SQL parametrizado; no contienen reglas HTTP.
- **DB:** centraliza la conexión e inicialización. Las migraciones tienen versión y se aplican una vez.

## Contrato de endpoints

| Método | Endpoint | Resultado |
|---|---|---|
| GET | `/api/countries` | `200 OK`, arreglo JSON |
| GET | `/api/countries/:id` | `200 OK` o `404 Not Found` |
| POST | `/api/countries` | `201 Created`, `400` por validación, `409` por duplicado |
| PUT | `/api/countries/:id` | `200 OK`, `400`, `404` o `409` |
| PATCH | `/api/countries/:id` | `200 OK`, `400`, `404` o `409` |
| DELETE | `/api/countries/:id` | `204 No Content` o `404 Not Found` |

### Campos requeridos para POST y PUT

```json
{
  "alpha2": "UY",
  "alpha3": "URY",
  "numeric_code": "858",
  "name": "Uruguay",
  "continent": "América del Sur",
  "population": 3500000
}
```

Para `PATCH`, envíe uno o más campos de ese objeto. El código Alfa-2 identifica el registro y no se cambia al actualizar. La API normaliza los códigos a mayúsculas y conserva el código numérico como texto para mantener ceros iniciales.

## Evidencias de pruebas locales con cURL

Arranque primero el servidor con `npm run dev`. Ejecute estos comandos en otra terminal.

### 1. Camino feliz: crear un país (201 Created)

```bash
curl -i -X POST http://localhost:3000/api/countries \
  -H "Content-Type: application/json" \
  -d '{"alpha2":"UY","alpha3":"URY","numeric_code":"858","name":"Uruguay","continent":"América del Sur","population":3500000}'
```

Resultado esperado: `HTTP/1.1 201 Created` y el país creado en JSON. Si vuelve a ejecutar el comando, obtendrá `409 Conflict` porque el país ya existe.

### 2. Validación: datos incompletos (400 Bad Request)

```bash
curl -i -X POST http://localhost:3000/api/countries \
  -H "Content-Type: application/json" \
  -d '{"alpha2":"XX","name":"País incompleto"}'
```

Resultado esperado: `HTTP/1.1 400 Bad Request`, por ejemplo `{"error":"El campo \"alpha3\" es obligatorio."}`. La validación ocurre en el servicio antes de hacer una inserción.

### 3. Recurso inexistente (404 Not Found)

```bash
curl -i http://localhost:3000/api/countries/ZZ
```

Resultado esperado: `HTTP/1.1 404 Not Found` y `{"error":"País no encontrado."}`.

### Pruebas adicionales

```bash
# Listar países
curl -i http://localhost:3000/api/countries

# Consultar Colombia
curl -i http://localhost:3000/api/countries/CO

# Actualizar población (PATCH)
curl -i -X PATCH http://localhost:3000/api/countries/CO \
  -H "Content-Type: application/json" \
  -d '{"population":52500000}'

# Eliminar un registro (204 No Content)
curl -i -X DELETE http://localhost:3000/api/countries/UY
```

Los resultados indicados son los estados esperados al ejecutar los comandos; adjunte capturas de su propia terminal o de Postman después de ejecutarlos para aportar evidencia visual real.

## Notas de diseño

- Las consultas SQL usan parámetros `?`, evitando concatenar datos del usuario en valores SQL.
- `numeric_code` es texto, no entero, para conservar códigos como `004`.
- Los errores de validación se responden con `400`; duplicados con `409`; inexistentes con `404`.
- El archivo SQLite se genera en la primera ejecución y no necesita crearse manualmente.


## Interfaz web y consumo de API

El frontend está implementado con JavaScript y Fetch API, sin duplicar las reglas de negocio del backend.

| Acción en la interfaz | Petición HTTP |
|---|---|
| Cargar listado | `GET /api/countries` |
| Crear país | `POST /api/countries` |
| Editar país | `PUT /api/countries/:id` |
| Eliminar país | `DELETE /api/countries/:id` |

La vista presenta una tabla dinámica, búsqueda, tarjetas de resumen, formulario modal, validaciones de campos y confirmación antes de eliminar. Los mensajes visuales informan el resultado de las peticiones; por ejemplo, `201 Created` al crear, `400 Bad Request` por datos inválidos, `404 Not Found` si el registro no existe y `409 Conflict` ante duplicados.

## Configuración CORS

El middleware `cors` está configurado en `src/app.js`. Por defecto permite el origen `http://localhost:5173` y `http://127.0.0.1:5173`, que corresponden al servidor local de Vite. Las solicitudes sin encabezado `Origin` (como Postman o cURL) también se permiten.

Los orígenes autorizados se pueden modificar mediante `CORS_ORIGINS` en el `.env`, separados por comas. Por ejemplo:

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Flujo recomendado para la demostración

1. Iniciar el backend en una terminal.
2. Iniciar Vite desde la carpeta `frontend` en otra terminal.
3. Abrir `http://localhost:5173`.
4. Crear un país de prueba y verificar el mensaje de creación.
5. Editar el registro y comprobar el cambio en la tabla.
6. Buscar el país usando el cuadro de búsqueda.
7. Eliminar el registro y aceptar la confirmación.
8. Mostrar en el navegador o en las herramientas de desarrollo que las peticiones se envían a `http://localhost:3000/api/countries`.

Los estados y mensajes descritos son el comportamiento implementado en el cliente; las capturas de evidencia deben obtenerse ejecutando la aplicación localmente.
