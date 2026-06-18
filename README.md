# 🚀 CotizaAPI Global

Dashboard interactivo y adaptativo desarrollado como actividad práctica de integración de servicios externos en producción.

## 🛠️ Arquitectura del Proyecto
La aplicación consta de un cliente estático (Frontend) desarrollado con HTML5 nativo, estilos de diseño responsivo, e integra un flujo lógico de llamadas Fetch asíncronas para resolver y sincronizar los datos de 3 proveedores externos.

```
   [ Usuario interactúa con la interfaz ]
                     |
                     v
             [ APP FRONTEND ]
         /           |           \
        v            v            v
  [ API Clima ]  [ API Países ]  [ API Moneda ]
```

## 🔌 APIs Utilizadas en la Aplicación
1. **OpenWeather API**: Consulta el clima de una ciudad mostrando temperatura, humedad y descripción.
2. **REST Countries API**: Obtiene información del país como capital, moneda oficial e idioma.
3. **ExchangeRate API**: Convierte el total de una cotización USD a la moneda del país seleccionado.

## 💻 Configuración Local e Instalación
1. Clona este repositorio público:
   ```bash
   git clone https://github.com/tu-usuario/nombre-del-repo.git
   ```
2. Abre el archivo `index.html` de forma directa o ejecuta un servidor en vivo local. No requiere variables de entorno pesadas en el cliente local.
