# CotizaAPI Global

## Nombre del proyecto

**CotizaAPI Global - Sistema de cotizaciones con integracion de 3 APIs**

## Problema que resuelve

CotizaAPI Global permite crear cotizaciones para productos o servicios calculando precio, mano de obra, IVA, subtotal y total. Tambien complementa cada cotizacion con informacion internacional util para clientes: datos del pais, clima por ciudad y conversion del total desde USD a otra moneda.

El proyecto mantiene:

- Ingreso de precio del producto o servicio.
- Ingreso de mano de obra.
- Calculo de IVA, subtotal y total.
- Historial de cotizaciones.
- Descarga de PDF.
- Guardado en Supabase cuando la base de datos esta disponible.

## APIs usadas

### 1. REST Countries

Endpoint usado:

```text
https://restcountries.com/v3.1/name/{pais}
```

Funcion dentro del proyecto:

- Permite escribir un pais.
- Muestra bandera.
- Muestra moneda.
- Muestra idioma.

### 2. OpenWeather

Endpoint usado:

```text
https://api.openweathermap.org/data/2.5/weather
```

Funcion dentro del proyecto:

- Permite escribir una ciudad.
- Muestra temperatura.
- Muestra humedad.
- Muestra descripcion del clima.

Configuracion:

En `app.js` se deja preparada la constante:

```js
const WEATHER_API_KEY = "TU_API_KEY_AQUI";
```

Para usar OpenWeather, reemplaza `TU_API_KEY_AQUI` por una clave real de OpenWeather.

### 3. ExchangeRate API

Endpoint usado:

```text
https://open.er-api.com/v6/latest/USD
```

Funcion dentro del proyecto:

- Toma el total de la cotizacion en USD.
- Permite escribir una moneda destino, por ejemplo `EUR`, `COP` o `MXN`.
- Convierte el total usando la tasa de cambio actual.

## Como ejecutar el proyecto

Este proyecto es una pagina web estatica con HTML, CSS y JavaScript.

1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador.
3. Crea una cuenta local o inicia sesion si ya existe.
4. Ingresa los datos de la cotizacion.
5. Usa el panel **APIs Globales** para consultar pais, clima y conversion de moneda.
6. Guarda la cotizacion y descarga el PDF desde el historial.

## Link del deploy

Repositorio:

```text
https://github.com/chitoadrian/Aporte-Web
```

Deploy:

```text
Agrega aqui el enlace publico de GitHub Pages, Vercel o Netlify cuando este publicado.
```
