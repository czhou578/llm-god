// import store from './store';

const ipcRenderer1 = window.electron.ipcRenderer;

const form = document.getElementById('form') as HTMLFormElement;
const templateContent = document.getElementById('template-content') as HTMLTextAreaElement;

form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted');
    ipcRenderer1.send('save-prompt', templateContent.value);

    // store.set('prompt', templateContent.value);
    // console.log(store.get('prompt'));
});