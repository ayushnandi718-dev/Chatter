import { Show, SignInButton, SignUpButton } from '@clerk/react';
import UserMenu from './components/UserMenu.jsx';
import './App.css'

function App() {

return (
    <div>
      <h1><img src="/logo.svg" alt="Chatter logo" className="app-logo" />Chatter</h1>

       <header>
        <Show when="signed-out">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserMenu />
        </Show>
      </header>
    </div>
  );
}

export default App
