const sectionClass = "space-y-2";
const titleClass = "text-[14px] font-bold text-[#d4d4d8]";
const textClass = "text-[13px] text-[#a1a1aa] leading-relaxed";

export function TermsContent() {
  return (
    <div className="space-y-5">
      <div className={sectionClass}>
        <h3 className={titleClass}>1. Que es La Trading Box</h3>
        <p className={textClass}>
          La Trading Box es una herramienta personal de registro y seguimiento de operaciones de trading.
          Te permite llevar un diario de trades, trackear tu rendimiento y organizar tu operativa.
          <strong className="text-[#d4d4d8]"> No somos un broker, no ejecutamos operaciones, no gestionamos dinero
          y no brindamos asesoramiento financiero de ningun tipo.</strong>
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>2. Tu cuenta</h3>
        <p className={textClass}>
          Al registrarte, te pedimos un email y una contrasena. Sos responsable de mantener tus
          credenciales seguras. Si sospechamos actividad inusual o abuso, podemos suspender la cuenta.
          Podes eliminar tu cuenta en cualquier momento contactandonos.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>3. Tus datos</h3>
        <p className={textClass}>
          Los datos que cargues (trades, notas, estrategias, diario) son tuyos. Nosotros solo los
          almacenamos para que la aplicacion funcione. No vendemos, compartimos ni usamos tus datos
          con fines comerciales. No almacenamos credenciales de brokers ni tenemos acceso a tus cuentas
          de trading reales.
        </p>
        <p className={textClass}>
          Usamos <strong className="text-[#d4d4d8]">Supabase</strong> como infraestructura de base de datos
          y autenticacion. Tu contrasena se almacena hasheada (bcrypt) y nunca en texto plano.
          La conexion esta cifrada con TLS/SSL.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>4. Uso aceptable</h3>
        <p className={textClass}>
          La Trading Box es para uso personal y legitimo de tracking de operaciones. No esta permitido:
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
          estadistica, grafico o metrica que muestre la aplicacion es puramente informativa y basada
          en los datos que vos mismo cargaste. Las decisiones de trading son exclusivamente tuyas.
          No nos hacemos responsables por perdidas financieras derivadas del uso de la aplicacion
          o de la interpretacion de los datos mostrados.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>6. Disponibilidad</h3>
        <p className={textClass}>
          Hacemos lo posible por mantener la aplicacion disponible, pero no garantizamos un uptime
          del 100%. Puede haber interrupciones por mantenimiento, actualizaciones o factores externos.
          No somos responsables por la perdida de datos derivada de fallos tecnicos, aunque tomamos
          medidas razonables para prevenirlo.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>7. Cambios en los terminos</h3>
        <p className={textClass}>
          Podemos actualizar estos terminos si la aplicacion evoluciona (por ejemplo, al agregar
          funcionalidades de pago). Te notificaremos por email si hay cambios significativos.
          El uso continuado de la plataforma despues de una actualizacion implica la aceptacion
          de los nuevos terminos.
        </p>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>8. Contacto</h3>
        <p className={textClass}>
          Si tenes dudas, sugerencias o queres eliminar tu cuenta, escribinos a{" "}
          <span className="text-[#5eead4] font-mono">soporte@latradingbox.com</span>.
        </p>
      </div>
    </div>
  );
}
