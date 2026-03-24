// Lista dos arquivos de documentação (adicione aqui se novos arquivos forem criados)
const docs = [
  { file: 'alocacao_affinity.md', label: 'Alocação Affinity' },
  { file: 'alocacao_demais_ramos.md', label: 'Alocação Demais Ramos' },
  { file: 'alocacao_rco.md', label: 'Alocação RCO' },
  { file: 'assistencia_mawdy.md', label: 'Assistência Mawdy' },
  { file: 'assistencia_maxpar.md', label: 'Assistência Maxpar' },
  { file: 'dbt_kovr_innoveo.md', label: 'DBT KOVR / Innoveo' },
  { file: 'ferramenta_relatorios.md', label: 'Ferramenta de Relatórios' },
  { file: 'helppi_natura.md', label: 'Helppi Natura' },
  { file: 'notificacao_carteira.md', label: 'Notificação de Carteira' },
  { file: 'oficio_susep.md', label: 'Ofício SUSEP' },
  { file: 'pagamento_comissao.md', label: 'Pagamento de Comissões' },
  { file: 'pipelines_mongodb.md', label: 'Pipelines MongoDB' },
  { file: 'rd_diarios.md', label: 'RD Diários' },
  { file: 'rebalanceamento_analistas.md', label: 'Rebalanceamento de Analistas' },
  { file: 'relatorio_area_dados.md', label: 'Consultas SQL' },
];

const docsList = document.getElementById('docs-list');
const docContent = document.getElementById('doc-content');

// Gera o menu lateral
docs.forEach((doc, idx) => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = doc.label;
  a.onclick = (e) => {
    e.preventDefault();
    loadDoc(doc.file, a);
  };
  if (idx === 0) a.classList.add('active');
  li.appendChild(a);
  docsList.appendChild(li);
});

// Carrega o primeiro doc por padrão
window.onload = () => {
  loadDoc(docs[0].file, docsList.querySelector('a'));
};

function loadDoc(filename, link) {
  // Remove active de todos
  docsList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');
  fetch('docs/' + filename)
    .then(resp => resp.ok ? resp.text() : '# Erro ao carregar o arquivo')
    .then(md => {
      docContent.innerHTML = marked.parse(md);
    });
}