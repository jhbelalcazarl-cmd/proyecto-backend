# API REST de países del mundo

API de servidor construida con Node.js, Express y SQLite. Administra países usando una arquitectura por capas: rutas → controladores → servicios → repositorios. No incluye frontend.

## Requisitos

- Node.js 18 o superior
- npm

## Configuración y ejecución

```bash
npm install
npm run dev
```

La API queda disponible en `http://localhost:3000`. Al arrancar, crea automáticamente `data/app.db`, crea las tablas y ejecuta los scripts SQL de `src/db/migrations/` una sola vez por versión. La variable `DB_FILE` en `.env` permite cambiar la ruta de la base de datos.

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
