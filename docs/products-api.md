# API de productos

Este documento describe los contratos de la API de productos y los requisitos funcionales de la interfaz de usuario relacionados.

## Endpoints y contratos

### GET `/products`
- **Respuesta**: lista de objetos `Product`.

### GET `/products/{id}`
- **Respuesta**: objeto `Product`.

### POST `/products`
- **Crea** un producto.
- **Body**:
  ```json
  {
    "sku": "string",
    "isbn": "string",
    "title": "string",
    "author": "string",
    "description": "string",
    "price": 0,
    "active": true,
    "categoryId": "uuid"
  }
  ```
- **Respuesta**: objeto `Product` completo (incluye `id`, `categoryName`, `createdAt`, `updatedAt`).

### PUT `/products/{id}`
- **Reemplaza** por completo un producto existente.
- **Body**:
  ```json
  {
    "id": "uuid",
    "sku": "string",
    "isbn": "string",
    "title": "string",
    "author": "string",
    "description": "string",
    "price": 0,
    "active": true,
    "categoryId": "uuid"
  }
  ```
- **Respuesta**: objeto `Product` completo actualizado.

### PATCH `/products/{id}`
- **Actualiza** parcialmente un producto existente.
- **Body**: cualquier subconjunto válido del objeto admitido por el endpoint `PUT`.
- **Respuesta**: objeto `Product` completo actualizado.

### DELETE `/products/{id}`
- **Elimina** un producto.
- **Respuesta**: `200 OK` sin cuerpo.

### Esquema `Product`
```json
{
  "id": "uuid",
  "sku": "string",
  "isbn": "string",
  "title": "string",
  "author": "string",
  "description": "string",
  "price": 0,
  "active": true,
  "categoryId": "uuid",
  "categoryName": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## Reglas de validación

- `sku`: requerido y único.
- `title`: requerido y no puede estar vacío.
- `price`: numérico y mayor o igual que 0.
- `active`: booleano.
- `id` y `categoryId`: UUID v4 válidos.
- `createdAt` y `updatedAt`: cadenas en formato ISO 8601.
- `isbn`: opcional.

## Requisitos de interfaz de usuario

### Listado de productos
- **Presentación**: tabla con las columnas `sku`, `title`, `author`, `price`, `active`, `categoryName` y `updatedAt`.
- **Búsqueda**: por `sku`, `title` e `isbn`.
- **Filtros**: por estado `active` y por categoría.
- **Ordenamiento**: por `updatedAt` y por `price` (ascendente o descendente).
- **Paginación**: debe soportarse.

### Detalle de producto
- Mostrar todos los campos del objeto `Product`.
- Acciones disponibles:
  - **Editar**.
  - **Eliminar** con confirmación previa.
  - **Alternar estado** (`Toggle Active`), que invierte el valor de `active` y refresca los datos.

### Formularios de crear y editar
- Validación en vivo de campos requeridos, `price >= 0` y formato UUID para `categoryId` (y `id` cuando aplique).
- Mostrar `categoryName` si está presente en la respuesta de la API.
- Gestionar estados de carga, mensajes de error y notificaciones de éxito.
