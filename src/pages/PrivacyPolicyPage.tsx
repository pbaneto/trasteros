import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';

const PrivacyPolicyPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header onOpenAuth={openAuthModal} />
      
      {/* Main Content */}
      <main className="flex-grow pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
          <p className="mt-2 text-gray-600">Información sobre el tratamiento de datos personales</p>
        </div>

        <div className="px-6 py-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              1. Información al usuario
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Trasteros, como Responsable del tratamiento, le informa que, según lo dispuesto en el Reglamento (UE) 2016/679 de 27 de abril (RGPD) y en la L.O. 3/2018 de 5 de diciembre (LOPDGDD), trataremos sus datos tal y como reflejamos en la presente Política de Privacidad.</p>
              <p>En esta Política de Privacidad describimos cómo recogemos sus datos personales y por qué los recogemos, qué hacemos con ellos, con quién los compartimos, cómo los protegemos y sus opciones en cuanto al tratamiento de sus datos personales.</p>
              <p>Esta política se aplica al tratamiento de sus datos personales recogidos por la empresa para la prestación de sus servicios. Si acepta las medidas de esta Política de Privacidad, acepta que tratemos sus datos personales como se define en esta Política.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              2. Contacto
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Denominación social:</strong> Trasteros</p>
              <p><strong>Nombre comercial:</strong> Trasteros</p>
              <p><strong>CIF:</strong> [A incluir cuando esté disponible]</p>
              <p><strong>Domicilio:</strong> Las Rozas, Madrid</p>
              <p><strong>e-mail:</strong> info@trasteros.com</p>
              <p><strong>Teléfono:</strong> 900 000 000</p>
              <p><strong>Sitio Web:</strong> www.trasteros.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              3. Principios que aplicamos a su información personal
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>En el tratamiento de sus datos personales, aplicaremos los siguientes principios que se ajustan al Reglamento Europeo de Protección de Datos:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li><strong>Principio de licitud, lealtad y transparencia:</strong> Siempre vamos a requerir su consentimiento para el tratamiento de sus datos personales para uno o varios fines específicos que le informaremos previamente con absoluta transparencia.</li>
                <li><strong>Principio de minimización de datos:</strong> Solo vamos a solicitar datos estrictamente necesarios en relación con los fines para los que los necesitamos. Los mínimos posibles.</li>
                <li><strong>Principio de limitación del plazo de conservación:</strong> Los datos serán mantenidos durante no más tiempo del necesario para los fines del tratamiento, en función a la finalidad. Le informaremos del plazo de conservación correspondiente según la finalidad.</li>
                <li><strong>Principio de integridad y confidencialidad:</strong> Sus datos serán tratados de tal manera que se garantice una seguridad adecuada de los datos personales y se proteja contra el tratamiento no autorizado o ilícito y contra su pérdida, destrucción o daño accidental.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              4. ¿Cómo hemos obtenido sus datos?
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Los datos personales que tratamos en Trasteros proceden de:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>Formulario de contacto</li>
                <li>Formulario de suscripción</li>
                <li>Formulario de registro como usuario</li>
                <li>Formularios de contratación de servicios</li>
                <li>Autenticación mediante servicios de terceros (Google OAuth)</li>
                <li>Comunicaciones telefónicas</li>
                <li>Comunicaciones por WhatsApp</li>
                <li>Comunicaciones por correo electrónico</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              5. ¿Cuáles son sus derechos cuando nos facilita sus datos?
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Cualquier persona tiene derecho a obtener confirmación sobre si en Trasteros estamos tratando datos personales que les conciernan, o no.</p>
              <p>Las personas interesadas tienen derecho a:</p>
              <ul className="list-disc ml-8 space-y-2">
                <li><strong>Solicitar el acceso</strong> a los datos personales relativos al interesado</li>
                <li><strong>Solicitar su rectificación</strong> o supresión</li>
                <li><strong>Solicitar la limitación</strong> de su tratamiento</li>
                <li><strong>Oponerse al tratamiento</strong></li>
                <li><strong>Solicitar la portabilidad</strong> de los datos</li>
              </ul>
              <p>Los interesados podrán acceder a sus datos personales, así como a solicitar la rectificación de los datos inexactos o, en su caso, solicitar su supresión cuando, entre otros motivos, los datos ya no sean necesarios para los fines que fueron recogidos. En determinadas circunstancias, los interesados podrán solicitar la limitación del tratamiento de sus datos, en cuyo caso únicamente los conservaremos para el ejercicio o la defensa de reclamaciones.</p>
              <p>En determinadas circunstancias y por motivos relacionados con su situación particular, los interesados podrán oponerse al tratamiento de sus datos. Trasteros dejará de tratar los datos, salvo por motivos legítimos imperiosos, o el ejercicio o la defensa de posibles reclamaciones. Como interesado, tiene derecho a recibir los datos personales que le incumban, que nos haya proporcionado y en un formato estructurado, de uso común y lectura mecánica, y a transmitirlos a otro responsable del tratamiento cuando el tratamiento esté basado en el consentimiento o en un contrato y el tratamiento se efectúe por medios automatizados.</p>
              <p><strong>¿Cómo puede ejercitar sus derechos?</strong></p>
              <p>Para ejercitar sus derechos de acceso, rectificación, supresión, limitación u oposición tiene que enviarnos un correo electrónico a info@trasteros.com junto con la prueba válida en derecho como una fotocopia del D.N.I. o equivalente.</p>
              <p>Tiene derecho a la tutela judicial efectiva y a presentar una reclamación ante la autoridad de control, en este caso, la Agencia Española de Protección de Datos, si considera que el tratamiento de datos personales que le conciernen infringe el Reglamento.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              6. Finalidad del tratamiento de datos personales
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>En Trasteros tratamos la información que nos facilitan las personas interesadas con las siguientes finalidades:</p>
              <table className="min-w-full border-collapse border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Finalidad</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Base legal</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Plazo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Gestión de contratos de alquiler</td>
                    <td className="border border-gray-300 px-4 py-2">Ejecución de contrato</td>
                    <td className="border border-gray-300 px-4 py-2">Duración del contrato + 6 años</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Verificación de identidad</td>
                    <td className="border border-gray-300 px-4 py-2">Cumplimiento obligación legal</td>
                    <td className="border border-gray-300 px-4 py-2">Duración del contrato + 6 años</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Procesamiento de pagos</td>
                    <td className="border border-gray-300 px-4 py-2">Ejecución de contrato</td>
                    <td className="border border-gray-300 px-4 py-2">Duración del contrato + 6 años</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Comunicaciones de servicio (WhatsApp/Email)</td>
                    <td className="border border-gray-300 px-4 py-2">Ejecución de contrato</td>
                    <td className="border border-gray-300 px-4 py-2">Duración del contrato</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Comunicaciones comerciales</td>
                    <td className="border border-gray-300 px-4 py-2">Consentimiento</td>
                    <td className="border border-gray-300 px-4 py-2">Hasta retirada del consentimiento</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Atención al cliente</td>
                    <td className="border border-gray-300 px-4 py-2">Interés legítimo</td>
                    <td className="border border-gray-300 px-4 py-2">Duración del contrato + 1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              7. ¿Por cuánto tiempo conservamos sus datos?
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Los datos personales proporcionados se conservarán:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>Mientras dure la relación comercial</li>
                <li>Durante los años necesarios para cumplir con las obligaciones legales</li>
                <li>Durante el plazo de prescripción de las acciones que pudieran derivarse de la relación mantenida con el cliente</li>
              </ul>
              <p>En concreto:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li><strong>Datos contractuales:</strong> 6 años tras la finalización del contrato</li>
                <li><strong>Datos de facturación:</strong> 4 años (obligación legal fiscal)</li>
                <li><strong>Comunicaciones comerciales:</strong> Hasta que retire el consentimiento</li>
                <li><strong>Datos de navegación y cookies:</strong> Máximo 2 años</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              8. ¿A qué destinatarios se comunican sus datos?
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Los datos que nos proporciona están ubicados en servidores cuya titularidad corresponde a terceros proveedores de servicios. Sus datos podrán ser compartidos con:</p>
              <table className="min-w-full border-collapse border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Destinatario</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Finalidad</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Stripe, Inc.</td>
                    <td className="border border-gray-300 px-4 py-2">Procesamiento de pagos</td>
                    <td className="border border-gray-300 px-4 py-2">Estados Unidos (Decisión de Adecuación)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Supabase</td>
                    <td className="border border-gray-300 px-4 py-2">Hosting y base de datos</td>
                    <td className="border border-gray-300 px-4 py-2">Unión Europea</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Twilio Inc.</td>
                    <td className="border border-gray-300 px-4 py-2">Comunicaciones por WhatsApp</td>
                    <td className="border border-gray-300 px-4 py-2">Estados Unidos (Decisión de Adecuación)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Google LLC</td>
                    <td className="border border-gray-300 px-4 py-2">Autenticación OAuth</td>
                    <td className="border border-gray-300 px-4 py-2">Estados Unidos (Decisión de Adecuación)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Administraciones Públicas</td>
                    <td className="border border-gray-300 px-4 py-2">Cumplimiento obligaciones fiscales</td>
                    <td className="border border-gray-300 px-4 py-2">España</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-4">Todos nuestros proveedores de servicios son considerados Encargados del Tratamiento según el RGPD, y mantenemos con ellos los correspondientes contratos de encargo de tratamiento para garantizar la seguridad y confidencialidad de sus datos.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              9. Comunicaciones por WhatsApp Business
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Utilizamos WhatsApp Business API para el envío de comunicaciones relacionadas directamente con la prestación de nuestros servicios. Estas comunicaciones incluyen:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>Códigos de verificación de número de teléfono</li>
                <li>Códigos de acceso a las instalaciones</li>
                <li>Notificaciones de pago y recordatorios</li>
                <li>Comunicaciones urgentes sobre el estado del servicio</li>
                <li>Confirmaciones de reservas y cambios en el servicio</li>
              </ul>
              <p><strong>Base legal:</strong> El envío de estas comunicaciones tiene como base legal la ejecución del contrato de prestación de servicios.</p>
              <p><strong>Consentimiento:</strong> Al facilitar su número de teléfono y aceptar los términos de servicio, consiente expresamente al envío de comunicaciones por WhatsApp Business.</p>
              <p><strong>Retirada de consentimiento:</strong> Puede solicitar no recibir comunicaciones por WhatsApp en cualquier momento contactando con nuestro servicio de atención al cliente. Tenga en cuenta que esto puede afectar a la correcta prestación del servicio.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              8. Sus derechos
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>8.1.</strong> Como titular de los datos, tiene derecho a:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
                <li><strong>Limitación:</strong> Restringir el tratamiento en determinadas circunstancias</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento por motivos legítimos</li>
              </ul>
              <p><strong>8.2.</strong> Para ejercer estos derechos, contacte con nosotros en info@trasteros.com adjuntando copia de su DNI.</p>
              <p><strong>8.3.</strong> Si no está satisfecho con el tratamiento de sus datos, puede presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              10. Medidas de seguridad
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Tratamos sus datos con total confidencialidad y, cumpliendo con el deber de secreto, hemos adoptado todas las medidas de índole técnica y organizativa necesarias que garanticen la seguridad de sus datos de carácter personal y eviten su alteración, pérdida, tratamiento o acceso no autorizado, habida cuenta del estado de la tecnología, la naturaleza de los datos almacenados y los riesgos a que están expuestos, ya provengan de la acción humana o del medio físico o natural.</p>
              <p>Las medidas de seguridad implementadas incluyen:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>Cifrado de datos en tránsito mediante protocolo SSL/TLS</li>
                <li>Cifrado de datos en reposo en bases de datos</li>
                <li>Control de acceso basado en roles y autenticación multifactor</li>
                <li>Monitorización continua de sistemas y detección de intrusos</li>
                <li>Copias de seguridad regulares y plan de recuperación ante desastres</li>
                <li>Auditorías regulares de seguridad y vulnerabilidades</li>
                <li>Formación del personal en protección de datos y seguridad</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              11. Cookies
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Este sitio web utiliza cookies para mejorar la experiencia del usuario y garantizar el correcto funcionamiento de la página. Una cookie es un pequeño archivo de información que se guarda en su navegador cada vez que visita nuestra página web.</p>
              <p><strong>Tipos de cookies que utilizamos:</strong></p>
              <ul className="list-disc ml-8 space-y-1">
                <li><strong>Cookies técnicas:</strong> Imprescindibles para el correcto funcionamiento del sitio web</li>
                <li><strong>Cookies de autenticación:</strong> Para mantener la sesión del usuario iniciada</li>
                <li><strong>Cookies de personalización:</strong> Para recordar las preferencias del usuario</li>
                <li><strong>Cookies analíticas:</strong> Para analizar el uso del sitio web (requieren consentimiento)</li>
              </ul>
              <p>La utilidad de las cookies es la de guardar el historial de su actividad en nuestra página web, de manera que, cuando la visite nuevamente, ésta pueda identificarle y configurar el contenido de la misma en base a sus hábitos de navegación, identidad y preferencias.</p>
              <p>Las cookies pueden ser aceptadas, rechazadas, bloqueadas y borradas, según desee. Ello podrá hacerlo desde su navegador. En cada navegador la operativa es diferente, la función de "Ayuda" le mostrará cómo hacerlo.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              12. Consentimiento
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Al usar nuestro sitio web, aceptar nuestros términos y condiciones, y facilitar su información personal, consiente el tratamiento de la misma en los términos de la presente Política de Privacidad.</p>
              <p>Para cualquier cuestión adicional sobre el tratamiento de sus datos personales, puede dirigirse a nuestro servicio de atención al cliente a través del correo electrónico info@trasteros.com.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              13. Cambios en la presente Política de Privacidad
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Trasteros se reserva el derecho a modificar la presente política para adaptarla a novedades legislativas o jurisprudenciales, así como a prácticas de la industria.</p>
              <p>En dichos supuestos, Trasteros anunciará en esta página los cambios introducidos con razonable antelación a su puesta en práctica.</p>
            </div>
          </section>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Esta Política de Privacidad cumple con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
          </p>
        </div>
      </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authMode}
      />
    </div>
  );
};

export default PrivacyPolicyPage;