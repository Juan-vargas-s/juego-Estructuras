# Logic Crush — juego match-3

Proyecto minimal: juego web empaquetable con Electron (.exe) y envoltura Cordova para Android (.apk).

Archivos principales:
- `index.html` — interfaz del juego
- `css/style.css` — estilos
- `js/game.js` — lógica del juego
- `electron-main.js` — entry para Electron
- `config.xml` — archivo mínimo para Cordova

Assets: usa las imágenes en `img/prop` y sonidos en `music/` ya presentes en la carpeta.

Instrucciones rápidas (Windows):

1) Requisitos

 - Node.js (v16+)
 - npm
 - Para .exe: nada más (uso de `electron-builder`).
 - Para .apk: instalar Cordova y Android SDK / Android Studio.

2) Ejecutar local (navegador)

```bash
# abrir index.html directamente con el navegador
npx http-server . -p 8080
# visitar http://localhost:8080
```

3) Ejecutar con Electron (modo desarrollo)

```bash
npm install
npm run start
```

4) Generar .exe (Windows)

```bash
npm install
npm run dist
```

Esto crea instalador/paquete en la carpeta `dist/` (requiere `electron-builder`).

5) Preparar APK con Cordova (esquema)

```bash
# instalar cordova
npm install -g cordova
# crear proyecto cordova (si quieres mantener separado)
cordova create logiccrush com.example.logiccrush LogicCrush
cd logiccrush
# copiar todo el contenido del proyecto (index.html, css, js, img, music) dentro de carpeta www/
cordova platform add android
cordova build android --release
```

Nota: Para generar APK necesitas configurar el SDK de Android y las variables de entorno.

Si quieres, puedo:
- Ejecutar `npm install` y verificar la app en Electron (si me das permiso). 
- Preparar un script para copiar archivos a un proyecto Cordova/Capacitor.
