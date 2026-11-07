import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // optional, if you use routing
import { signIn } from "../../../state/userSlice/userSlice";

const useSignin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate(); // optional
  const { loading, error, currentUser } = useSelector((state) => state.user);

  const handleSignin = async (e) => {
    e.preventDefault();

    // Basic validation before sending request
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const resultAction = await dispatch(signIn({ email, password }));

      // Check if login succeeded
      if (signIn.fulfilled.match(resultAction)) if (signIn.fulfilled.match(resultAction)) {
        const role = resultAction.payload.userData.role;

        console.log("✅ Login successful:", role);

        if (role === "FinancialManager") {
          navigate("/financialdashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        console.error("❌ Login failed:", resultAction.payload);
      }
    } catch (err) {
      console.error("⚠️ Unexpected error during sign-in:", err);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    handleSignin,
    isLoading: loading,
    error,
    currentUser,
  };
};

export default useSignin;
