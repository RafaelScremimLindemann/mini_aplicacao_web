//localStorage.clear();
alasql('CREATE LOCALSTORAGE DATABASE IF NOT EXISTS agrosqldb');
alasql('ATTACH LOCALSTORAGE DATABASE agrosqldb');
alasql('USE agrosqldb');
// Inicializar banco de dados
alasql('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username STRING, password STRING)');
const usuarioAdmin = alasql('SELECT * FROM users WHERE username = "admin"');
if (usuarioAdmin.length === 0) {
  alasql('INSERT INTO users (username, password) VALUES ("admin", "1234")');
}
alasql('CREATE TABLE IF NOT EXISTS clients (id INT AUTO_INCREMENT PRIMARY KEY, name STRING, cpf STRING, birth STRING, phone STRING, cel STRING)');
alasql('CREATE TABLE IF NOT EXISTS addresses (id INT AUTO_INCREMENT PRIMARY KEY, \
        client_id INT REFERENCES clients(id),cep STRING, street STRING, neighborhood STRING, city STRING, state STRING, country STRING, is_primary BOOLEAN DEFAULT FALSE)');

// 

//Salvando o Usuário no LocalStorage
function salvarUsuariosLocalStorage() {
  const usuarios = alasql('SELECT * FROM users');
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

//Carregando os Usuários do LocalStorage
function carregarUsuariosLocalStorage() {
  const usuariosSalvos = localStorage.getItem('usuarios');
  if (usuariosSalvos) {
    const usuarios = JSON.parse(usuariosSalvos);
    
    // Itera sobre os usuários salvos e insere apenas se ainda não existir
    usuarios.forEach(usuario => {
      //const usuarioExistente = alasql('SELECT * FROM users WHERE username = ?', [usuario.username]);
      //if (usuarioExistente.length === 0) {
        alasql('INSERT INTO users (username, password) VALUES (?, ?)', [usuario.username, usuario.password]);
      //}
    });
  }
}

// Mostrar seção
function showSection(sectionId) {
  document.querySelectorAll('.form-section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(sectionId).style.display = 'block';
}

//Função que Mostra a tela solicitada
function showScreen(screenId) {
  // Esconde todas as telas
  document.querySelectorAll('.screen').forEach((screen) => {
      screen.style.display = 'none';
  });
  document.getElementById(screenId).style.display = 'block';
}

//carregarUsuariosLocalStorage();

//Validando Login
document.getElementById('login-form').onsubmit = (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const result = alasql('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  if (result.length) {
    console.log('Login bem-sucedido, exibindo o menu principal.');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
  } else {
    document.getElementById('login-error').innerText = 'Usuário ou senha incorretos!';
  }
};



// Garante que o menu principal comece oculto
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('main-menu').classList.add('hidden'); 
});

//Mostra tela Cadastro de Cliente.
document.getElementById('btn-client').addEventListener('click', () => showScreen('client-screen'));

//Mostra tela Cadastro de Endereço.
document.getElementById('btn-address').addEventListener('click', () => showScreen('adress-screen'));

//Botão Salvar um cliente.
//O navegador aguarda o DOM estar completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save-client').addEventListener('click', addClient);
  });

//Voltar para menu inicial (Cliente).
document.getElementById('back-btn').addEventListener('click', () => showScreen('main-menu'));

//Voltar para menu inicial (Usuário).
document.getElementById('back-user').addEventListener('click', () => showScreen('main-menu'));

//Voltar para menu inicial (Endereço).
document.getElementById('back-adress').addEventListener('click', () => showScreen('main-menu'));

//Mostra tela Cadastro de Usuário.
document.getElementById('btn-users').addEventListener('click', () => showScreen('users-screen'));

//Mostra tela Cadastro de Endereço.
document.getElementById('btn-address').addEventListener('click', () => showScreen('adress-screen'));

//Botão deslogar.
document.getElementById('logout-btn').addEventListener('click', logout);

//Botão remover todos usuários.
document.getElementById('delete-users').addEventListener('click', deleteAllUsers);

//Criando evento no botao export-btn
document.getElementById('export-btn').addEventListener('click', () => {
  exportDatabaseToJSON('agrosqldb');
});

//Logout
function logout() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('login-screen').style.display = 'block';
}

function deleteAllUsers(event){
  event.preventDefault();
  alasql('DELETE FROM users');
}

// Adicionar cliente
function addClient(event) {
  event.preventDefault();
  const name = document.getElementById('client-name').value;
  const cpf = document.getElementById('client-cpf').value;
  const birth = document.getElementById('client-birth').value;
  const phone = document.getElementById('client-phone').value;
  const cel = document.getElementById('client-cel').value;
  
  const verificaCPF = alasql('SELECT * FROM clients WHERE cpf= ?', [cpf]);
  if(verificaCPF.length > 0){
    alert('CPF já cadastrado!');
    return;
  }
  else{
  alasql('INSERT INTO clients (name,cpf,birth,phone,cel) VALUES (?,?,?,?,?)', [name,cpf, birth, phone, cel]);
  alert('Cliente cadastrado com sucesso!');
  document.getElementById('client-name').value = '';
  document.getElementById('client-cpf').value = '';
  document.getElementById('client-birth').value = '';
  document.getElementById('client-phone').value = '';
  document.getElementById('client-cel').value = '';
}
}


// Função para carregar clientes no dropdown
function loadClients(filter = '') {
  const clients = alasql('SELECT id, name FROM clients');
  const clientSelect = document.getElementById('clientSelect');
  clientSelect.innerHTML = ''; // Limpa as opções anteriores

  // Filtrar clientes com base no texto digitado
  const filteredClients = clients.filter(client =>
      client.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Adiciona as opções filtradas ao dropdown
  filteredClients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      clientSelect.appendChild(option);
  });

  // Caso não encontre nenhum cliente, adiciona uma mensagem
  if (filteredClients.length === 0) {
      const option = document.createElement('option');
      option.textContent = 'Nenhum cliente encontrado';
      option.disabled = true;
      clientSelect.appendChild(option);
  }
}


// Função para salvar o endereço
function saveAddress(event) {
  event.preventDefault();

  // Obter os valores do formulário
  const clientId = document.getElementById('clientSelect').value;
  const cep = document.getElementById('adress-cep').value;
  const street = document.getElementById('adress-street').value;
  const neighborhood = document.getElementById('adress-neighborhood').value;
  const city = document.getElementById('adress-city').value;
  const state = document.getElementById('adress-state').value;
  const country = document.getElementById('adress-country').value;
  const isPrimary = document.getElementById('isPrimary').checked;

// Se o endereço for principal, desmarcar outros endereços do mesmo cliente
  if (isPrimary) {
    alasql('UPDATE addresses SET is_primary = FALSE WHERE client_id = ?', [clientId]);
}

// Inserir o novo endereço no banco de dados
alasql(
    `INSERT INTO addresses (client_id, cep, street, neighborhood, city, state, country, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [clientId, cep, street, neighborhood, city, state, country, isPrimary]
);

alert('Endereço cadastrado com sucesso!');
document.getElementById('adress-cep').value = '';
document.getElementById('adress-street').value = '';
document.getElementById('adress-neighborhood').value = '';
document.getElementById('adress-city').value = '';
document.getElementById('adress-state').value = '';
document.getElementById('password').value = '';
document.getElementById('adress-country').value = '';
// Limpa o formulário
}


//Preenchendo o cliente na tela endereço
document.getElementById('searchClient').addEventListener('input', (event) => {
  const filter = event.target.value; // Texto digitado
  loadClients(filter);
});

//Botão Salvar um Usuário.
//O navegador aguarda o DOM estar completamente carregado.
//document.addEventListener('DOMContentLoaded', () => {
document.getElementById('save-user').addEventListener('click', addUsers);
//});

//Botão Salvar um Endereço.
//O navegador aguarda o DOM estar completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-adress').addEventListener('click', saveAddress);
});

// Adicionar usuário
function addUsers(event) {
  event.preventDefault();
  const username = document.getElementById('user-name').value;
  const password = document.getElementById('pass-word').value;

  const verificaUsuario = alasql('SELECT * FROM users WHERE username= ?', [username]);
  if(verificaUsuario.length > 0){
    alert('Usuário já cadastrado!');
    return;
  }
  else{
  console.log("Senha capturada:", password);
  alasql('INSERT INTO users (username, password) VALUES (?,?)', [username, password]);
  salvarUsuariosLocalStorage();
  alert('Cliente cadastrado com sucesso!');
  document.getElementById('user-name').value = '';
  document.getElementById('password').value = '';
}
}

//Função para exportar o banco.
function exportDatabaseToJSON(databaseName) {
  // Obtém todas as tabelas do banco de dados
  const tables = alasql.tables;

  // Converte os dados das tabelas para um objeto JSON
  const databaseData = {};
  for (let tableName in tables) {
      databaseData[tableName] = alasql(`SELECT * FROM ${tableName}`);
  }

  // Converte o objeto JSON para uma string JSON formatada
  const jsonString = JSON.stringify(databaseData, null, 2);

  // Cria um blob para download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${databaseName}.json`;
  downloadLink.click();
}



// Processar o arquivo JSON e carregar no banco de dados
document.getElementById('processDb').addEventListener('click', () => {
  const fileInput = document.getElementById('uploadDb');
  const file = fileInput.files[0];

  if (!file) {
      alert('Por favor, selecione um arquivo JSON!');
      return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
      try {
          // Parse do conteúdo do arquivo JSON
          const data = JSON.parse(event.target.result);

          // Verificar se o JSON contém a tabela "users"
          if (!data.users) {
              alert('Arquivo inválido! Certifique-se de incluir a tabela "users".');
              return;
          }

          // Inserir os dados no banco de dados
          data.users.forEach(user => {
              alasql(
                  `INSERT INTO users (username, password) VALUES (?, ?)`,
                  [user.username, user.password]
              );
          });

          alert('Usuários carregados com sucesso!');
      } catch (error) {
          console.error('Erro ao processar o arquivo:', error);
          alert('Erro ao carregar os usuários. Certifique-se de que o arquivo é válido.');
      }
  };

  // Ler o arquivo selecionado
  reader.readAsText(file);
});

// Chama a função ao carregar a página ou um botão
document.getElementById('list-client').addEventListener('click', () => {
  // Consulta os dados da tabela 'clients'
  const clientes = alasql('SELECT * FROM clients');

  // Obtém a tabela no HTML
  const tabela = document.getElementById('clients-table').getElementsByTagName('tbody')[0];

  // Limpa o conteúdo atual da tabela
  tabela.innerHTML = '';

  // Insere cada cliente como uma nova linha na tabela
  clientes.forEach(cliente => {
    const linha = tabela.insertRow(); // Cria uma nova linha

    // Adiciona células com os dados do cliente
    const id = linha.insertCell(0);
    const name = linha.insertCell(1);
    const cpf = linha.insertCell(2);
    const birth = linha.insertCell(3);
    const phone = linha.insertCell(4);
    const cel = linha.insertCell(5);

    // Preenche as células com os dados
    id.textContent = cliente.id;
    name.textContent = cliente.name;
    cpf.textContent = cliente.cpf;
    birth.textContent = cliente.birth;
    phone.textContent = cliente.phone;
    cel.textContent = cliente.cel;
  });
});


