import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Keyboard, ImageUp, ScanLine, CheckCircle2 } from 'lucide-react';

// Formatos aceitos: QR Code e os códigos de barras mais comuns em etiquetas de estoque
const FORMATOS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.DATA_MATRIX
];

const READER_ID = 'leitor-codigo-epi';

/**
 * Modal de cadastro de equipamento por código.
 * - Câmera: lê QR Code ou código de barras em tempo real
 * - Imagem: lê o código a partir de uma foto/arquivo
 * - Digitar: código manual ou leitor de código de barras USB (que "digita" e envia Enter)
 */
export const ScannerCodigoModal = ({ onClose, onCodigo }) => {
  const [modo, setModo] = useState('manual');
  const [codigoManual, setCodigoManual] = useState('');
  const [erroCamera, setErroCamera] = useState('');
  const scannerRef = useRef(null);
  const lidoRef = useRef(false);
  const manualInputRef = useRef(null);

  const getScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(READER_ID, { formatsToSupport: FORMATOS, verbose: false });
    }
    return scannerRef.current;
  };

  // Liga/desliga a câmera conforme o modo selecionado
  useEffect(() => {
    if (modo !== 'camera') return undefined;
    let cancelado = false;
    lidoRef.current = false;
    setErroCamera('');

    const scanner = getScanner();
    const iniciar = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, 300), height: Math.min(h, 200) }) },
      (texto) => {
        if (lidoRef.current || cancelado) return;
        lidoRef.current = true;
        onCodigo(texto);
      },
      () => {} // falhas por frame são normais enquanto procura o código
    ).catch(err => {
      if (!cancelado) setErroCamera(`Não foi possível acessar a câmera: ${err?.message || err}. Use as opções "Imagem" ou "Digitar".`);
    });

    return () => {
      cancelado = true;
      iniciar.finally(() => {
        if (scanner.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
      });
    };
  }, [modo]);

  useEffect(() => {
    if (modo === 'manual') manualInputRef.current?.focus();
  }, [modo]);

  const handleImagem = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErroCamera('');
    try {
      const texto = await getScanner().scanFile(arquivo, false);
      onCodigo(texto);
    } catch {
      setErroCamera('Nenhum QR Code ou código de barras encontrado nessa imagem. Tente uma foto mais nítida.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (codigoManual.trim()) onCodigo(codigoManual.trim());
  };

  const abas = [
    { id: 'manual', label: 'Digitar / Leitor USB', Icon: Keyboard },
    { id: 'camera', label: 'Câmera', Icon: Camera },
    { id: 'imagem', label: 'Imagem', Icon: ImageUp }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScanLine color="#00d4aa" size={22} />
            Cadastrar Equipamento por Código
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Leia o QR Code ou o código de barras da etiqueta, ou digite o código do equipamento.
          Se o código já existir, o EPI abre para edição; se for novo, abre o cadastro já preenchido.
        </p>

        <div className="tabs" style={{ marginBottom: '1.25rem' }}>
          {abas.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`tab-btn ${modo === id ? 'active' : ''}`}
              onClick={() => setModo(id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Área usada pela biblioteca para renderizar o vídeo da câmera */}
        <div
          id={READER_ID}
          style={{
            display: modo === 'camera' ? 'block' : 'none',
            width: '100%',
            minHeight: modo === 'camera' ? '240px' : 0,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#000',
            marginBottom: '1rem'
          }}
        />

        {modo === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label className="form-label">Código do Equipamento</label>
              <input
                ref={manualInputRef}
                className="form-input"
                placeholder="Ex: EPI-006 ou 7891234567895"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Com um leitor de código de barras USB, basta clicar no campo e bipar a etiqueta.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <CheckCircle2 size={16} /> Continuar
              </button>
            </div>
          </form>
        )}

        {modo === 'imagem' && (
          <div className="form-group">
            <label className="form-label">Foto da etiqueta (QR Code ou código de barras)</label>
            <input type="file" accept="image/*" className="form-input" onChange={handleImagem} />
          </div>
        )}

        {modo === 'camera' && !erroCamera && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Aponte a câmera para o QR Code ou código de barras.
          </div>
        )}

        {erroCamera && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            {erroCamera}
          </div>
        )}
      </div>
    </div>
  );
};
