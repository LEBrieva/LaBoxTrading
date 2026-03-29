# La Trading Box — Preguntas Frecuentes (FAQ)

---

## General

### Qué es La Trading Box?

La Trading Box es un journal de trading personal. Te permite registrar operaciones, analizar estadísticas, seguir tu equity curve y mejorar tu rendimiento como trader. No es un broker, no ejecuta trades, no maneja dinero ni brinda asesoramiento financiero.

### Es gratis?

Sí. La Trading Box es un proyecto gratuito y mantenido de forma voluntaria. Si querés apoyar el desarrollo, podés hacer una donación desde la sección de Settings.

### Puedo usarla desde el celular?

Sí. La app es totalmente responsive y se puede instalar como PWA (Progressive Web App) en tu celular desde el navegador, para usarla como si fuera una app nativa.

### En qué idioma está la app?

La interfaz está en español.

---

## Cuenta y Autenticación

### Cómo me registro?

Desde la página de registro con tu email y una contraseña. La contraseña debe tener mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 carácter especial.

### Me olvidé la contraseña, qué hago?

En la pantalla de login hay un link "Olvidaste tu contraseña?". Ingresá tu email y vas a recibir un link para restablecerla.

### Mis datos están seguros?

Sí. Las contraseñas se encriptan con bcrypt (nunca se guardan en texto plano). Todas las conexiones usan TLS/SSL. La base de datos está en Supabase. No se venden, comparten ni usan tus datos con fines comerciales.

### Puedo eliminar mi cuenta?

Sí. Podés solicitar la eliminación de tu cuenta escribiendo a soporte@latradingbox.com.

---

## Cuentas de Trading

### Qué es una "cuenta" dentro de la app?

Una cuenta representa una cuenta de trading en un broker. Cada cuenta tiene su propio capital inicial, capital objetivo, trades y estadísticas de forma independiente.

### Puedo tener varias cuentas?

Sí. Podés crear múltiples cuentas y cambiar entre ellas desde el selector en el header.

### Qué brokers están soportados?

Actualmente **SimpleFX** con soporte completo (incluyendo importación de CSV). **Bitget** está marcado como "próximamente".

### Puedo asociar una wallet a mi cuenta?

Sí, de forma opcional. Podés agregar una dirección de wallet (BEP20, ERC20 o TRC20) a tu cuenta para referencia.

---

## Trades

### Cómo creo un trade?

Desde la sección Trades, tocando el botón "+ Nuevo Trade". Completás par, dirección (LONG/SHORT), precio de entrada, stop loss, take profit, tamaño de posición y riesgo. También podés agregar notas, una estrategia y una captura de pantalla.

### Qué es el campo "External ID"?

Es el ID del trade en tu broker. Sirve para identificar y matchear trades al importar CSV, evitando duplicados.

### Puedo importar trades desde mi broker?

Sí, si usás **SimpleFX**. Exportá tu historial como CSV desde SimpleFX y usá el botón "Importar CSV" en la sección de Trades. La app detecta duplicados, matchea cierres parciales y te muestra un resumen de la importación.

### Qué pasa si no pongo Stop Loss?

La app te muestra una advertencia pidiéndote confirmación. Es recomendable siempre definir un SL para un correcto cálculo de riesgo.

### Cómo funciona el cierre parcial?

Cada trade puede tener múltiples posiciones. Podés cerrar cada posición de forma individual con resultado TP, SL, BE o PARCIAL (indicando el % cerrado). Esto te permite registrar cierres parciales sin perder el historial de cada tramo.

### Qué resultados puede tener una posición?

- **TP** — Cerrada en Take Profit
- **SL** — Cerrada en Stop Loss
- **BE** — Cerrada en Break Even (sin ganancia ni pérdida)
- **PARTIAL** — Cierre parcial (se indica el porcentaje cerrado)
- **OPEN** — Todavía abierta

### Puedo subir capturas de pantalla de mis trades?

Sí. Al crear un trade podés adjuntar una imagen de tu setup. Se muestra en el detalle del trade para referencia visual.

---

## Riesgo

### Qué son las reglas de riesgo?

En Settings podés configurar dos reglas por cuenta:

- **Límite de pérdida diaria (USD)** — Monto máximo que podés perder en un día. Si lo excedés, la app te avisa al crear un nuevo trade.
- **Riesgo máximo por trade (%)** — Porcentaje máximo del capital que podés arriesgar en un solo trade.

### Cómo se calcula el riesgo?

- **Riesgo USD** = Capital actual x (Riesgo % / 100)
- **Riesgo %** = (Riesgo USD / Capital actual) x 100
- El Take Profit se puede calcular automáticamente a partir del Entry, SL y ratio R:R.

---

## Estrategias

### Qué son las estrategias?

Son checklists personalizadas que definís vos. Cada estrategia tiene un nombre, descripción y campos custom (checkbox, texto, selector, rango). Al crear un trade, podés asociarle una estrategia para validar que cumple tus criterios.

### Puedo crear varias estrategias?

Sí, podés crear todas las que necesités y asociar cualquiera a cada trade.

---

## Estadísticas y Dashboard

### Qué métricas muestra el dashboard?

- P&L total (monto y porcentaje)
- Win Rate (% de trades ganados)
- Cantidad de trades cerrados
- Racha actual (wins/losses consecutivos)
- Mejor trade y peor trade
- Progreso hacia el capital objetivo
- Equity curve (gráfico de evolución del capital)
- P&L diario (gráfico de barras con filtro 7d/30d/todo)

### El P&L de trades abiertos se calcula en vivo?

Sí. La app se conecta a un feed de precios y calcula el P&L no realizado en tiempo real para las posiciones abiertas.

---

## Calendario y Journal

### Qué muestra el calendario?

Un calendario mensual donde cada día se colorea según tu rendimiento (verde = ganancia, rojo = pérdida, gris = sin trades). También muestra el mood si escribiste una entrada de journal.

### Cómo funciona el journal?

Al tocar un día en el calendario podés escribir una entrada de diario con:

- Texto libre (hasta 5000 caracteres)
- Mood del día (Excelente, Bien, Normal, Mal, Terrible)
- Tags con hashtags (hasta 10 por entrada)

Es una entrada por día máximo.

---

## Movimientos

### Qué son los movimientos?

Son registros de depósitos, retiros o ajustes manuales en tu cuenta. Afectan el capital actual y la equity curve.

### Qué tipos de movimientos hay?

- **Depósito** — Fondos agregados a la cuenta
- **Retiro** — Fondos retirados de la cuenta
- **Ajuste** — Corrección manual del balance

---

## Modo Privacidad

### Qué es el modo privacidad?

Un toggle en el header que oculta todos los montos de la pantalla, reemplazándolos con "***". Útil para compartir pantalla o sacar capturas sin exponer tus números.

---

## Soporte

### Cómo puedo contactar soporte?

Escribiendo a **soporte@latradingbox.com** para consultas, pedidos de funcionalidades o eliminación de cuenta.

### Hay una comunidad?

Sí. Podés unirte al servidor de Discord desde el botón en el header de la app.

### Cómo puedo apoyar el proyecto?

Desde la sección de Settings podés ver las wallets de donación disponibles en distintas redes (BEP20, ERC20, BTC, SOL).
