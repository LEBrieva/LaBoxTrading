const sectionClass = "space-y-2";
const titleClass = "text-[14px] font-bold text-[#d4d4d8]";
const textClass = "text-[13px] text-[#a1a1aa] leading-relaxed";

export function TermsContent() {
  return (
    <div className="space-y-5">
      <div className={sectionClass}>
        <h3 className={titleClass}>1. Qué es La Trading Box</h3>
        <p className={textClass}>
          La Trading Box es una herramienta personal de registro y seguimiento de operaciones de trading.
          Te permite llevar un diario de trades, trackear tu rendimiento y organizar tu operativa.
          <strong className="text-[#d4d4d8]"> No somos un broker, no ejecutamos operaciones, no gestionamos dinero
          y no brindamos asesoramiento financiero de ningún tipo.</strong>
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>2. Tu cuenta</h3>
        <p className={textClass}>
          Al registrarte, te pedimos un email y una contraseña. Sos responsable de mantener tus
          credenciales seguras. Si sospechamos actividad inusual o abuso, podemos suspender la cuenta.
          Podés eliminar tu cuenta en cualquier momento contactándonos.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>3. Tus datos</h3>
        <p className={textClass}>
          Los datos que cargues (trades, notas, estrategias, diario) son tuyos. Nosotros solo los
          almacenamos para que la aplicación funcione. No vendemos, compartimos ni usamos tus datos
          con fines comerciales. No almacenamos credenciales de brokers ni tenemos acceso a tus cuentas
          de trading reales.
        </p>
        <p className={textClass}>
          Usamos <strong className="text-[#d4d4d8]">Supabase</strong> como infraestructura de base de datos
          y autenticación. Tu contraseña se almacena hasheada (bcrypt) y nunca en texto plano.
          La conexión está cifrada con TLS/SSL.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>4. Uso aceptable</h3>
        <p className={textClass}>
          La Trading Box es para uso personal y legítimo de tracking de operaciones. No está permitido:
        </p>
        <ul className="list-disc list-inside text-[13px] text-[#a1a1aa] space-y-1 pl-2">
          <li>Intentar acceder a datos de otros usuarios</li>
          <li>Usar la plataforma para actividades ilegales</li>
          <li>Automatizar solicitudes masivas que afecten el servicio</li>
          <li>Revender o redistribuir el acceso a la plataforma</li>
        </ul>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>5. Disclaimer financiero</h3>
        <p className={textClass}>
          <strong className="text-[#d4d4d8]">La Trading Box no es asesoramiento financiero.</strong> Cualquier
          estadística, gráfico o métrica que muestre la aplicación es puramente informativa y basada
          en los datos que vos mismo cargaste. Las decisiones de trading son exclusivamente tuyas.
          No nos hacemos responsables por pérdidas financieras derivadas del uso de la aplicación
          o de la interpretación de los datos mostrados.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>6. Disponibilidad</h3>
        <p className={textClass}>
          Hacemos lo posible por mantener la aplicación disponible, pero no garantizamos un uptime
          del 100%. Puede haber interrupciones por mantenimiento, actualizaciones o factores externos.
          No somos responsables por la pérdida de datos derivada de fallos técnicos, aunque tomamos
          medidas razonables para prevenirlo.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>7. Cambios en los términos</h3>
        <p className={textClass}>
          Podemos actualizar estos términos si la aplicación evoluciona (por ejemplo, al agregar
          funcionalidades de pago). Te notificaremos por email si hay cambios significativos.
          El uso continuado de la plataforma después de una actualización implica la aceptación
          de los nuevos términos.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>8. Contacto</h3>
        <p className={textClass}>
          Si tenés dudas, sugerencias o querés eliminar tu cuenta, escribinos a{" "}
          <span className="text-[#5eead4] font-mono">soporte@latradingbox.com</span>.
        </p>
      </div>
    </div>
  );
}
