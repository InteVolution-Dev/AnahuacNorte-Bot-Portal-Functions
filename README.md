# Flow Management Service for Azure AI Foundry Agents

Este servicio forma parte de la plataforma de integración entre la Universidad Anáhuac y Microsoft Azure AI Foundry.  
Permite registrar, validar, transformar y exponer flujos transaccionales definidos en formato **OpenAPI**, convirtiéndolos en **Function Tools** compatibles con agentes de Azure AI (Foundry).

El servicio está implementado como **Azure Functions (Node.js)** y funciona como backend para el portal de administración de flujos.

---

## 🚀 Objetivo del Proyecto

El propósito del servicio es:

1. **Recibir definiciones OpenAPI** enviadas por administradores a través del portal.
2. **Validarlas estrictamente** usando JSON Schema (AJV).
3. **Transformarlas en herramientas ("Function Tools")** que Azure AI Foundry pueda invocar mediante function calling.
4. **Guardar la definición en Azure Table Storage** como la *fuente de verdad* de los flujos activos.
5. **Exponer APIs para consultar, crear y administrar flujos** accesibles desde el frontend.

---

## 🧱 Arquitectura General

Azure Function App
│
├── /src/functions
│ ├── flowCreate.js → POST /api/create-flow
│ ├── flowList.js → GET /api/flows
│ └── healthCheck.js
│
├── /src/services/flows
│ ├── flowBuilder.js → buildFunctionToolFromOpenAPI()
│ ├── flowStorage.js → wrapper para Table Storage
│ └── flowParser.js → funciones auxiliares (opcional)
│
├── /src/schemas
│ └── flowCreate.schema.js
│
└── /src/utils
├── response.js
└── ...

---

## 🧪 Validación de Flujos: `AJV + JSON Schema`

El endpoint `POST /api/create-flow` valida la carga OpenAPI del administrador usando un esquema JSON estricto.

El schema garantiza:

- Propiedades esperadas (`info`, `servers`, `paths`, etc.)
- Rutas válidas con métodos HTTP válidos
- Códigos de respuesta estrictamente de 3 dígitos
- Estructura correcta del `requestBody`
- Prohibición explícita de propiedades adicionales usando:
  
```json
"additionalProperties": false
```
Esto evita inconsistencias en la definición de flujos.

## 🔄 Transformación OpenAPI → Function Tool (Foundry)
Cada operación del OpenAPI se transforma en un Function Tool, el formato que Azure AI Foundry espera recibir:

```
{
    "type": "function",
    "name": "<operationId>",
    "description": "<summary>",
    "parameters": {
        "type": "object",
        "properties": { ... },
        "required": [ ... ],
        "additionalProperties": false
    },
    "strict": true
}
```

Esta conversión se realiza en:
```
src/services/flows/flowBuilder.js
```

La función central es:
```
buildFunctionToolFromOpenAPI(openApi, path, method)
```

## 🧩 Estructura Persistida en Table Storage
Cada flujo se almacena como una entidad en flows:
```
{
  "id": "<uuid>",
  "active": true,

  "type": "function",
  "name": "...",
  "description": "...",
  "parameters": { ... },
  "strict": true,

  "serviceProperties": {
    "method": "POST",
    "path": "/english-alta",
    "baseUrl": "https://anahuac.edu.mx",
    "securityScheme": {
      "type": "apiKey",
      "headerName": "X-API-Key"
    },
    "requestBody": { ... },
    "responses": { ... }
  },

  "rawOpenAPI": "{...}",

  "createdAt": "...",
  "updatedAt": "..."
}
```
### Notas importantes:
**functionTool**: es lo que Foundry consume.

**serviceProperties**: es lo que nuestro backend usa para ejecutar la llamada real.

**rawOpenAPI**: permite auditoría y regeneración futura.

## ⚙️ Orden de Operaciones en flowCreate
1. Validar input con AJV
2. Parsear OpenAPI → construir functionTool
3. Generar serviceProperties
4. Guardar todo en Table Storage
5. Retornar 201 FLOW_CREATED

No se registra nada directamente en Foundry.
Las herramientas se envían dinámicamente en cada llamada al agente.

## 🧠 Razón del Diseño (Source of Truth)
### Table Storage es la fuente de verdad
* Foundry no tiene un “registro global” de funciones.
* Los tools se envían dinámicamente en cada request.
* Nuestro backend decide qué herramientas tiene disponible el agente según la tabla.

**Foundry solo recibe:**
```
tools: [functionTool1, functionTool2, ...]
```

cada vez que se llama a:
```
openaiClient.responses.create()
```

## 📡 Endpoints actuales
| Método | Ruta               | Descripción                             |
| ------ | ------------------ | --------------------------------------- |
| GET    | `/api/flows`       | Lista los flujos activos                |
| POST   | `/api/create-flow` | Crea un nuevo flujo a partir de OpenAPI |
| GET    | `/api/healthCheck` | Estado del servicio                     |

## 🔮 Próximos pasos (previstos)

* Implementar flowUpdate
* Implementar flowDelete (soft-delete con active = false)
* Endpoint test-flow para validar comportamiento contra Foundry
* Generación de herramientas preprocesadas (caching)
* Sincronización opcional con configuración del agente
* Validación automática de rutas contra backend real
* Versionamiento de flujos (v1, v2, etc.)

## 🧑‍💻 Requisitos de desarrollo
``` 
npm install
npm install ajv ajv-formats
func start
```
Azure CLI requerido para interacción con recursos.

## 📦 Notas sobre Azure Foundry

* Los Function Tools se definen dinámicamente por request.
* No existe un endpoint global “registrar función”.
* Este servicio debe proveer las herramientas en cada llamada al agente.
* Mantener bajo el número de function tools mejora la precisión del modelo.

## 🔐 Autenticación y Seguridad (SSO Microsoft Entra ID)

Este servicio utiliza Single Sign-On (SSO) basado en Microsoft Entra ID (Azure AD) para autenticar a los usuarios del portal administrativo.

La autenticación se realiza mediante Access Tokens JWT emitidos por Microsoft, los cuales son validados en el backend antes de permitir el acceso a cualquier endpoint protegido.

🧩 Flujo de Autenticación

El frontend autentica al usuario usando MSAL (Microsoft Authentication Library).

Se obtiene un Access Token con el scope:

`access_as_user`


El token se envía al backend vía:

`Authorization: Bearer <access_token>`


El backend:

* Verifica la firma criptográfica del token
* Valida audiencia (aud)
* Valida emisor (iss)
* Valida tenant (tid)
* Valida scope requerido
* Aplica reglas adicionales de autorización (dominio + allowlist)

### 🔑 Validación del Token (JWKS local)

Para la validación criptográfica del token, el servicio utiliza un JWKS (JSON Web Key Set) almacenado localmente, en lugar de consumir el endpoint remoto de Microsoft en tiempo de ejecución.

¿Por qué JWKS local?

Esta decisión es intencional y arquitectónica, basada en:

Estabilidad del servicio (sin dependencias de red en runtime)

Evitar problemas de TLS / certificados en entornos locales y productivos

Reducción de latencia

Comportamiento determinístico y fácil de depurar

Tráfico bajo y entorno administrativo controlado

Microsoft rota sus claves con poca frecuencia y mantiene múltiples claves activas simultáneamente, lo que permite que un JWKS local sea válido por largos periodos de tiempo.

### 📂 Implementación

El archivo JWKS se almacena localmente en el proyecto:

`src/middleware/jwks.local.json`

Y se utiliza con la librería jose mediante:

`createLocalJWKSet()`

Ejemplo simplificado:

```
const { jwtVerify, createLocalJWKSet } = require("jose");
const jwks = require("./jwks.local.json");

const JWKS = createLocalJWKSet(jwks);

const { payload } = await jwtVerify(token, JWKS, {
  audience: `api://${CLIENT_ID}`,
  issuer: `https://sts.windows.net/${TENANT_ID}/`,
});
```

### 🔄 Rotación de Claves (Operación)

En caso de que Microsoft rote una clave y el backend reciba un token firmado con un kid no presente en el JWKS local, la verificación fallará de forma explícita.

Procedimiento esperado:

1. Regenerar el JWKS desde el endpoint oficial:

`https://login.microsoftonline.com/<TENANT_ID>/discovery/v2.0/keys`

El comando desde CMD sería similar a este:

```
url -k https://login.microsoftonline.com/<TENANT_ID>/discovery/v2.0/keys > ./src/middleware/jwks.local.json
```

**NOTA**: No olvides actualizar el TENANT_ID con el valor correspondiente.

2. Actualizar jwks.local.json

**NOTA**: Asegurate de actualizar el archivo y que el contenido sea algo válido.

3. Desplegar el cambio

Este escenario es poco frecuente y aceptable para un portal administrativo.

### 🛡️ Autorización adicional (Defensa en profundidad)

Además de la validación del token, el backend aplica capas adicionales de autorización:

1️⃣ Dominio permitido

Solo se permite acceso a usuarios con correo del dominio:

`@anahuac.mx`

2️⃣ Allowlist de usuarios administradores

Existe una tabla dedicada en Azure Table Storage que define explícitamente qué usuarios pueden acceder al portal administrativo.

* PartitionKey: allowed-users
* RowKey: email normalizado del usuario

Cada request autenticado valida que el usuario esté presente en esta tabla.

Esto evita que:

* Alumnos
* Padres de familia
* Usuarios no administrativos

puedan acceder al portal aunque pertenezcan al tenant.

### 🧠 Principio aplicado

Este diseño sigue el principio de:

`Autenticación ≠ Autorización`

Microsoft Entra ID valida quién eres.
El backend valida si puedes estar aquí.

## 📜 Licencia
Propietario: Intevolution
Desarrollado por: Daniel Zanabria
Proyecto implementado para Universidad Anáhuac México.
Uso interno y bajo NDA.
