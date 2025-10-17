// ===============================
// Self-Assessment Portal v2.6
// ===============================

document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('Assessment iniciado');

  const qs = getQuestions();
  const questionsEl = document.getElementById('questions');

  if (!qs || qs.length === 0) {
    const el = document.getElementById('qError');
    el.style.display = 'block';
    el.innerText = 'Nenhuma pergunta encontrada.';
    return;
  }

  // Renderiza perguntas
  questionsEl.innerHTML = '';
  qs.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div class="badge">${q.category || 'Geral'}</div>
      <div class="title">${q.pergunta}</div>
      <div class="scale">${[1, 2, 3, 4, 5].map(n => `
        <input type="radio" id="q${i}_${n}" name="q${i}" value="${n}">
        <label for="q${i}_${n}">${n}</label>`).join('')}
      </div>`;
    questionsEl.appendChild(div);
  });

  // Botões
  document.getElementById('btnSalvar').addEventListener('click', () => save(false, qs));
  document.getElementById('btnEnviar').addEventListener('click', () => save(true, qs));
}

// Simulação de carregamento de perguntas (aqui viria o CSV)
function getQuestions() {
  return [
    { category: 'Comunicação', pergunta: 'Comunica-se claramente com a equipe?' },
    { category: 'Produtividade', pergunta: 'Entrega as tarefas dentro do prazo?' },
    { category: 'Resolução de Problemas', pergunta: 'Lida bem com imprevistos?' }
  ];
}

// Função de salvamento e envio
async function save(final, qs) {
  const nome = document.getElementById('nome')?.value.trim() || 'Sem nome';
  const area = document.getElementById('area')?.value.trim() || 'Não informada';
  const cargo = document.getElementById('cargo')?.value.trim() || 'Não informado';
  const answers = [];

  document.querySelectorAll('.scale input:checked').forEach(el => {
    answers.push(Number(el.value));
  });

  const banner = document.getElementById('banner');
  banner.textContent = final
    ? 'Avaliação enviada com sucesso.'
    : 'Rascunho salvo com sucesso.';
  banner.style.display = 'block';
  setTimeout(() => {
    banner.style.display = 'none';
    if (final) location.href = 'results.html';
  }, 1200);

  // ===== Envio ao Supabase =====
  try {
    const supabaseClient = window.supabase?.createClient
      ? window.supabase.createClient(SUPABASE.url, SUPABASE.anonKey)
      : null;

    if (!supabaseClient) {
      console.warn('Supabase client não encontrado.');
      return;
    }

    const { data, error } = await supabaseClient
      .from('responses')
      .insert([
        {
          email: document.querySelector('#email')?.value || 'anonimo@teste.com',
          quarter: document.querySelector('#quarterSpan')?.innerText || 'Q?',
          nome,
          area,
          cargo,
          respostas: answers,
          metas: [],
          final: final
        }
      ]);

    if (error) {
      console.error('Erro ao gravar no Supabase:', error);
    } else {
      console.log('Registro salvo no Supabase:', data);
    }
  } catch (e) {
    console.error('Falha geral Supabase:', e);
  }
}
