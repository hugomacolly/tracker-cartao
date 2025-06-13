// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "testekey",
  authDomain: "tracker-cartao.firebaseapp.com",
  projectId: "tracker-cartao",
  storageBucket: "tracker-cartao.firebasestorage.app",
  messagingSenderId: "505143364667",
  appId: "1:505143364667:web:45e4b2b8813e9cb15f201e"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Referências para os serviços de Autenticação e Firestore
const auth = firebase.auth();
const db = firebase.firestore();


// PASSO 2: REFERÊNCIAS AOS ELEMENTOS DO HTML (DOM)
// Telas
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// Forms
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const expenseForm = document.getElementById('expense-form');

// Botões e informações do usuário
const logoutButton = document.getElementById('logout-button');
const userEmailSpan = document.getElementById('user-email');

// Lista de transações
const transactionListDiv = document.getElementById('transaction-list');


// PASSO 3: LÓGICA DE AUTENTICAÇÃO

// Monitora mudanças no estado de autenticação (login/logout)
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado
        console.log("Usuário logado:", user.uid);
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userEmailSpan.textContent = user.email;
        loadTransactions(user.uid);
    } else {
        // Usuário está deslogado
        console.log("Nenhum usuário logado.");
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// Event Listener para o form de Cadastro
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log("Usuário cadastrado:", userCredential.user);
            signupForm.reset();
        })
        .catch(error => {
            alert(`Erro no cadastro: ${error.message}`);
        });
});

// Event Listener para o form de Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log("Usuário logado:", userCredential.user);
            loginForm.reset();
        })
        .catch(error => {
            alert(`Erro no login: ${error.message}`);
        });
});

// Event Listener para o botão de Logout
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log("Usuário deslogado com sucesso.");
        // O onAuthStateChanged vai cuidar de mostrar/esconder as telas
    });
});


// PASSO 4: LÓGICA DO BANCO DE DADOS (FIRESTORE)

// Event Listener para o form de adicionar gastos
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const card = document.getElementById('card').value;
    const userId = auth.currentUser.uid; // Pega o ID do usuário logado

    // Adiciona um novo documento na coleção "transactions"
    db.collection('transactions').add({
        description: description,
        amount: amount,
        category: category,
        card: card,
        userId: userId, // Essencial para saber a quem pertence o gasto
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Para ordenar
    })
    .then(docRef => {
        console.log("Gasto adicionado com ID: ", docRef.id);
        expenseForm.reset();
    })
    .catch(error => {
        console.error("Erro ao adicionar gasto: ", error);
        alert("Erro ao adicionar gasto.");
    });
});

// Função para carregar e exibir os gastos
function loadTransactions(userId) {
    transactionListDiv.innerHTML = 'Carregando...'; // Feedback para o usuário

    // Cria uma query que busca na coleção "transactions"
    // Onde o campo "userId" é igual ao ID do usuário logado
    // E ordena pelo campo "createdAt" em ordem decrescente (mais novo primeiro)
    db.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => { // onSnapshot fica "ouvindo" em tempo real
          transactionListDiv.innerHTML = ''; // Limpa a lista antiga
          if (querySnapshot.empty) {
            transactionListDiv.innerHTML = '<p>Nenhum gasto adicionado ainda.</p>';
            return;
          }

          querySnapshot.forEach(doc => {
              const transaction = doc.data();
              const transactionId = doc.id;

              // Cria o elemento HTML para o item da transação
              const item = document.createElement('div');
              item.classList.add('transaction-item');
              item.innerHTML = `
                  <div>
                      <div class="description">${transaction.description}</div>
                      <div class="category">${transaction.category} - Cartão: ${transaction.card}</div>
                  </div>
                  <div class="amount">R$ ${transaction.amount.toFixed(2).replace('.',',')}</div>
              `;
              transactionListDiv.appendChild(item);
          });
      }, error => {
          console.error("Erro ao carregar transações: ", error);
          transactionListDiv.innerHTML = '<p>Erro ao carregar os gastos.</p>';
      });
}
