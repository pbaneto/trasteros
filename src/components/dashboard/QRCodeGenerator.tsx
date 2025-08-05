import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Rental, QRCodeData } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QRCodeGeneratorProps {
  rental: Rental;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  rental,
  isOpen,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rental) {
      generateQRCode();
    }
  }, [isOpen, rental]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const qrData: QRCodeData = {
        rentalId: rental.id,
        unitNumber: rental.unit?.unitNumber || '',
        accessCode: rental.ttlockCode || '',
        expiresAt: rental.endDate,
      };

      const qrCodeData = JSON.stringify(qrData);
      const qrUrl = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      });

      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `trastero-${rental.unit?.unitNumber}-qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCodeUrl) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - Trastero ${rental.unit?.unitNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
              }
              .qr-container {
                max-width: 400px;
                margin: 0 auto;
              }
              .info {
                margin: 20px 0;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background-color: #f9f9f9;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>Trastero ${rental.unit?.unitNumber}</h1>
              <img src="${qrCodeUrl}" alt="Código QR" style="max-width: 100%;" />
              <div class="info">
                <p><strong>Código de acceso:</strong> ${rental.ttlockCode}</p>
                <p><strong>Ubicación:</strong> ${rental.unit?.locationDescription}</p>
                <p><strong>Válido hasta:</strong> ${format(new Date(rental.endDate), 'dd MMMM yyyy', { locale: es })}</p>
              </div>
              <p style="color: #666; font-size: 12px;">
                Escanea este código QR para acceder a tu trastero
              </p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11V9l-6 6-6-6v7a1 1 0 001 1h10a1 1 0 001-1z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Código QR - Trastero {rental.unit?.unitNumber}
                </h3>

                <div className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt="Código QR"
                          className="mx-auto mb-4 border border-gray-200 rounded-lg"
                        />
                      )}

                      <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Información del acceso:
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Código:</span>
                            <span className="font-mono font-semibold">
                              {rental.ttlockCode}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ubicación:</span>
                            <span>{rental.unit?.locationDescription}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Válido hasta:</span>
                            <span>
                              {format(new Date(rental.endDate), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 text-left">
                        <div className="flex">
                          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm text-blue-700">
                            <p className="font-medium mb-1">Instrucciones:</p>
                            <ul className="space-y-1">
                              <li>• Escanea el código QR con tu móvil</li>
                              <li>• O introduce el código manualmente</li>
                              <li>• Disponible 24/7</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <div className="flex space-x-3 sm:ml-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={loading || !qrCodeUrl}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Descargar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || !qrCodeUrl}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center btn-secondary sm:mt-0 sm:w-auto"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};