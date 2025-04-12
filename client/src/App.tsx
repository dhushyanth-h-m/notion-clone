import { Provider } from 'react-redux';
import { store } from './store/store';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <Sidebar />
        <div className="editor-container">
          <Editor />
        </div>
      </div>
    </Provider>
  );
}

export default App;
