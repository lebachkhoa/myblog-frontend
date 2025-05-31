import { Routes, Route, Link } from "react-router-dom"
import Login from "./pages/Login"
import Header from "./components/Header"

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  )
}

export default App
