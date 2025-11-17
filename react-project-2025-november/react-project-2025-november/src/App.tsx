import { Provider } from "react-redux";
import store from "./store";
import ProfileCalendar from "./components/ProfileCalendar";
import './App.css'

function App() {
  return (
    <Provider store={store()}>
      <ProfileCalendar />
    </Provider>
  );
}

export default App;
