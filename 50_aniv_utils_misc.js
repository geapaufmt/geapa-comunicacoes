/**************************************
 * Utils diversos
 **************************************/

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function aniv_getOccupationSemanticConfig_() {
  return (typeof ANIV_SEMANTIC_FIELDS !== 'undefined' && ANIV_SEMANTIC_FIELDS.OCCUPATION)
    ? ANIV_SEMANTIC_FIELDS.OCCUPATION
    : Object.freeze({
        label: 'Ocupação',
        aliases: Object.freeze(['Ocupação', 'Ocupacao', 'Cargo/Função', 'Cargo/Funcao']),
        preferredWriteOrder: Object.freeze(['Ocupação', 'Ocupacao', 'Cargo/Função', 'Cargo/Funcao'])
      });
}

function aniv_getOccupationLabel_() {
  return String(aniv_getOccupationSemanticConfig_().label || 'Ocupação');
}

function aniv_getOccupationHeaderAliases_() {
  return aniv_getOccupationSemanticConfig_().aliases || [];
}

function aniv_getOccupationPreferredWriteOrder_() {
  return aniv_getOccupationSemanticConfig_().preferredWriteOrder || aniv_getOccupationHeaderAliases_();
}

function aniv_findOccupationHeaderIndex_(headers, optional) {
  return aniv_findHeaderIndex_(headers, aniv_getOccupationHeaderAliases_(), optional);
}

function aniv_resolveOccupationHeaderForWrite_(headers) {
  if (!Array.isArray(headers) || !headers.length) return '';

  var normalizedExisting = {};
  headers.forEach(function(header) {
    var raw = String(header || '').trim();
    if (!raw) return;
    normalizedExisting[aniv_normHeader_(raw)] = raw;
  });

  var preferred = aniv_getOccupationPreferredWriteOrder_();
  for (var i = 0; i < preferred.length; i++) {
    var key = aniv_normHeader_(preferred[i]);
    if (normalizedExisting[key]) return normalizedExisting[key];
  }

  return '';
}

function aniv_getOccupationValue_(row, headers, occupationIndex) {
  if (!Array.isArray(row)) return '';

  var index = typeof occupationIndex === 'number' ? occupationIndex : aniv_findOccupationHeaderIndex_(headers, true);
  if (index < 0) return '';
  return String(row[index] || '').trim();
}

function aniv_getEntityOccupation_(entity) {
  if (!entity) return '';
  return String(entity.occupation || entity.role || '').trim();
}

function aniv_formatOccupationDisplay_(occupation) {
  var value = String(occupation || '').trim();
  return value ? aniv_getOccupationLabel_() + ': ' + value : '';
}
