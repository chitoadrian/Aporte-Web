# CotizaAPI Global

## Nombre del proyecto

**CotizaAPI Global - Sistema de cotizaciones con integración de 3 APIs**

## Problema que resuelve

CotizaAPI Global permite crear cotizaciones para productos o servicios calculando precio, mano de obra, IVA, subtotal y total. También complementa cada cotización con información internacional útil para clientes: datos del país, clima por ciudad y conversión del total desde USD a otra moneda.

El proyecto mantiene:

- Ingreso de precio del producto o servicio.
- Ingreso de mano de obra.
- Cálculo de IVA, subtotal y total.
- Historial de cotizaciones.
- Descarga de PDF con datos de cotización y datos de las 3 APIs.
- Guardado en Supabase cuando la base de datos está disponible.

## APIs usadas

### 1. REST Countries

Función dentro del proyecto:

- Permite escribir un país con autocomplete.
- Acepta nombres parciales y nombres en español, por ejemplo España o egi.
- Muestra bandera, moneda e idioma.

### 2. OpenWeather

Función dentro del proyecto:

- Permite escribir una ciudad.
- Muestra temperatura, humedad y descripción del clima.
- Si no hay clave configurada, muestra un mensaje claro sin romper la interfaz.

Configuración en `app.js`:

```js
const WEATHER_API_KEY = "PEGA_AQUI_TU_API_KEY_REAL";
```

Para usar OpenWeather, reemplaza `PEGA_AQUI_TU_API_KEY_REAL` por una clave real de OpenWeather.

### 3. ExchangeRate API

Función dentro del proyecto:

- Toma el total de la cotización en USD.
- Permite escribir o seleccionar una moneda destino, por ejemplo `EUR`, `COP` o `MXN`.
- Convierte el total usando la tasa de cambio actual.

## Manejo de errores

Las consultas se realizan con `fetch`, `async/await` y `try/catch`. Los errores genéricos de conexión se muestran al usuario como mensajes claros, por ejemplo:

- No se pudo conectar con la API. Revisa tu internet o intenta con otro nombre.
- No se encontró ese país. Prueba con otro nombre.
- Configura WEATHER_API_KEY para consultar el clima.

## Cómo ejecutar el proyecto

Este proyecto es una página web estática con HTML, CSS y JavaScript.

1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador.
3. Crea una cuenta local o inicia sesión si ya existe.
4. Ingresa los datos de la cotización.
5. Usa el panel **APIs Globales** para consultar país, clima y conversión de moneda.
6. Guarda la cotización y descarga el PDF desde el historial.

## Link del deploy

Agrega aquí el enlace público de GitHub Pages, Vercel o Netlify cuando esté publicado.
