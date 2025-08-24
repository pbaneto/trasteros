import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';

const ConditionsPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header onOpenAuth={openAuthModal} />
      
      {/* Main Content */}
      <main className="flex-grow pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
          <p className="mt-2 text-gray-600">Condiciones de uso para el alquiler de trasteros</p>
        </div>

        <div className="px-6 py-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              1. Verificación de identidad y entrega del código de acceso
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>1.1.</strong> El arrendatario deberá facilitar previamente todos sus datos personales para poder formalizar el contrato de alquiler, incluyendo: nombre, apellidos, DNI o NIE, dirección completa, teléfono de contacto y correo electrónico.</p>
              <p><strong>1.2.</strong> La verificación de identidad del arrendatario es condición indispensable para la contratación, así como para la suscripción de la póliza de seguros incluida en el precio del alquiler.</p>
              <p><strong>1.3.</strong> El código de acceso al trastero no se entregará hasta que se haya verificado la identidad del arrendatario y se haya efectuado el pago correspondiente.</p>
              <p><strong>1.4.</strong> Una vez recibido el pago, el código de acceso será enviado al arrendatario mediante correo electrónico o WhatsApp, al número o dirección de correo previamente facilitados en el contrato.</p>
              <p><strong>1.5.</strong> En caso de que cualquiera de los datos facilitados por el arrendatario sea falso, incorrecto o incompleto, se procederá a la anulación inmediata del alquiler y de la póliza de seguros, sin derecho a reembolso ni abono alguno. En tal caso, el arrendatario no podrá hacer uso de la póliza de seguros incluida en el precio.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              2. Pagos y facturación
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>2.1.</strong> Todos los pagos se realizarán exclusivamente a través de los medios de pago habilitados en la aplicación o página web de la empresa.</p>
              <p><strong>2.2.</strong> El arrendatario podrá optar por:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>a) Pago mediante suscripción periódica.</li>
                <li>b) Pago anticipado de varios meses de alquiler, beneficiándose de los descuentos vigentes para esta modalidad.</li>
              </ul>
              <p><strong>2.3.</strong> Todos los precios incluyen el Impuesto sobre el Valor Añadido (IVA) y el seguro mínimo obligatorio.</p>
              <p><strong>2.4.</strong> El arrendatario podrá contratar, de forma opcional y a su cargo, una póliza de seguros ampliada para cubrir un mayor importe de los bienes almacenados en el trastero, en función de su valor.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              3. Impagos
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>3.1.</strong> El alquiler se paga por meses completos y debe estar abonado antes de la fecha de vencimiento establecida en el contrato.</p>
              <p><strong>3.2.</strong> En caso de impago, el arrendatario será notificado el día inmediato siguiente al vencimiento.</p>
              <p><strong>3.3.</strong> A partir de la fecha de impago, el código de acceso al trastero y a las instalaciones será bloqueado automáticamente.</p>
              <p><strong>3.4.</strong> El arrendatario no podrá acceder a las instalaciones ni retirar sus pertenencias hasta que abone la totalidad de las cuotas mensuales pendientes.</p>
              <p><strong>3.5.</strong> Si transcurren tres (3) meses desde el inicio del impago sin que el arrendatario regularice su situación, se le notificará oficialmente la deuda acumulada.</p>
              <p><strong>3.6.</strong> En caso de persistir el impago, la empresa podrá iniciar el procedimiento legal correspondiente para acceder al contenido del trastero y, si fuese necesario, proceder a la venta o subasta de las pertenencias almacenadas con el fin de saldar total o parcialmente la deuda pendiente.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              4. Condiciones de uso y almacenamiento
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>4.1.</strong> La empresa no accederá en ningún momento al interior de los trasteros alquilados por los arrendatarios, salvo en el supuesto previsto en el punto 3.6 y siempre con la correspondiente autorización legal.</p>
              <p><strong>4.2.</strong> El arrendatario es el único responsable de la custodia, conservación y contenido de las pertenencias depositadas en el trastero.</p>
              <p><strong>4.3.</strong> Queda terminantemente prohibido almacenar en el trastero cualquiera de los siguientes objetos o sustancias:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>a) Productos inflamables, explosivos o combustibles.</li>
                <li>b) Sustancias tóxicas, corrosivas o peligrosas para la salud.</li>
                <li>c) Armas de fuego, munición o material pirotécnico.</li>
                <li>d) Drogas y cualquier sustancia ilegal.</li>
                <li>e) Alimentos perecederos o productos que puedan generar plagas, malos olores o deterioro de las instalaciones.</li>
                <li>f) Residuos, basura o cualquier tipo de material contaminante.</li>
                <li>g) Animales vivos o muertos.</li>
              </ul>
              <p><strong>4.4.</strong> En caso de que el arrendatario almacene cualquiera de los objetos o sustancias prohibidas y ello cause daños o perjuicios a las instalaciones, a la empresa o a terceros, la empresa:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>a) Bloqueará de forma inmediata la cuenta y el acceso del arrendatario.</li>
                <li>b) Presentará la correspondiente denuncia ante las autoridades competentes.</li>
                <li>c) Ejercerá acciones legales para reclamar la totalidad de los daños y perjuicios ocasionados.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              5. Seguridad y acceso a las instalaciones
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>5.1.</strong> El acceso a las instalaciones del trastero se realizará únicamente mediante el código facilitado por la empresa a través de los medios indicados en el contrato (correo electrónico o WhatsApp).</p>
              <p><strong>5.2.</strong> Queda terminantemente prohibido el acceso a las instalaciones sin el código proporcionado por la empresa.</p>
              <p><strong>5.3.</strong> El código de acceso solo será entregado a los arrendatarios que se encuentren al corriente de pago de sus cuotas de alquiler.</p>
              <p><strong>5.4.</strong> Todas las instalaciones, tanto en el exterior como en el interior, están vigiladas las 24 horas mediante cámaras de seguridad con conexión directa a las autoridades policiales.</p>
              <p><strong>5.5.</strong> El arrendatario es responsable de mantener confidencial su código de acceso y no podrá cederlo, venderlo, realquilar el trastero ni permitir el acceso a terceras personas no registradas bajo ninguna circunstancia.</p>
              <p><strong>5.6.</strong> Cualquier tercera persona que acceda a las instalaciones acompañando al arrendatario registrado será responsabilidad exclusiva del arrendatario titular del código. En caso de que dicha persona cause daños a las instalaciones, equipos, cámaras o cualquier otro bien, el arrendatario titular del código responderá de forma íntegra por los daños y perjuicios ocasionados, y podrá ser objeto de suspensión de acceso y acciones legales por parte de la empresa.</p>
              <p><strong>5.7.</strong> La zona situada frente a la puerta de acceso podrá utilizarse exclusivamente para carga y descarga de pertenencias. Queda prohibido su uso como aparcamiento permanente. Ningún arrendatario o acompañante podrá dejar su vehículo estacionado en esa zona mientras visita el trastero o permanece dentro de las instalaciones sin realizar carga o descarga activa.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              6. Uso interno de los trasteros
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>6.1.</strong> El arrendatario no podrá taladrar, perforar ni modificar las paredes, el techo, el suelo ni ninguna de las estructuras del trastero.</p>
              <p><strong>6.2.</strong> Está prohibida cualquier manipulación de la instalación eléctrica del alumbrado, de las cerraduras o de cualquier otro elemento estructural del trastero.</p>
              <p><strong>6.3.</strong> Se permite la instalación de estanterías u otros elementos siempre que:</p>
              <ul className="list-disc ml-8 space-y-1">
                <li>a) No requieran perforación ni alteración de paredes, techo, suelo ni estructuras del trastero.</li>
                <li>b) No afecten a la seguridad ni a la integridad del trastero.</li>
              </ul>
              <p><strong>6.4.</strong> Queda terminantemente prohibido utilizar los trasteros como vivienda, zona de descanso, dormitorio o cualquier actividad que implique permanencia de personas dentro de los mismos. Los trasteros únicamente podrán utilizarse para almacenar pertenencias y enseres del arrendatario.</p>
              <p><strong>6.5.</strong> Al finalizar la suscripción o alquiler del trastero, el arrendatario deberá devolver el trastero en exactas condiciones de entrega, tal como se encontraba al inicio del alquiler, incluyendo paredes, techo, suelo, cerraduras y estructuras.</p>
              <p><strong>6.6.</strong> Cualquier daño o alteración que implique modificación de la estructura será responsabilidad total del arrendatario y podrá dar lugar a la reclamación de los costes de reparación y acciones legales, si procede.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              7. Objetos y materiales prohibidos
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>7.1.</strong> Queda terminantemente prohibido almacenar en los trasteros cualquier sustancia o material ilegal, incluyendo drogas y todas las sustancias prohibidas por la ley.</p>
              <p><strong>7.2.</strong> Queda prohibido almacenar productos peligrosos, inflamables, explosivos o tóxicos, incluyendo, pero no limitado a, fuegos artificiales, gasolina, productos químicos agresivos, y materiales similares que puedan poner en riesgo la seguridad de las instalaciones o de terceros.</p>
              <p><strong>7.3.</strong> Se prohíbe expresamente el almacenamiento de patinetes eléctricos, baterías de litio, dispositivos electrónicos con baterías de alto riesgo o cualquier producto similar que sea altamente inflamable o pueda causar incendio, así como cualquier otro artículo cuya prohibición sea establecida en medios de transporte públicos por riesgo de incendio o explosión.</p>
              <p><strong>7.4.</strong> El incumplimiento de estas normas conllevará el bloqueo inmediato de la cuenta, la anulación de la póliza de seguro incluida y acciones legales para reclamar daños y perjuicios ocasionados a las instalaciones, a la empresa o a terceros.</p>
            </div>
          </section>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
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

export default ConditionsPage;
