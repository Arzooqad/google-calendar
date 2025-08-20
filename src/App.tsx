import { Provider } from "react-redux";
import { store } from "./store/store";
import { Calendar } from "./components/Calendar";
import { FilterPanel } from "./components/FilterPanel";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-9">
              <Calendar />
            </div>
            <div className="col-span-3">
              <FilterPanel />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer hideProgressBar={true} position="bottom-right" />
    </Provider>
  );
}

export default App;
