import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const StudentRoute = ({ children }) => {
  const { user } = useSelector(store => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error("Please login to continue");
      navigate('/login');
      return;
    }
    
    if (user.role !== 'student') {
      toast.error("This page is only accessible to students");
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <>
      {children}
    </>
  );
};

export default StudentRoute; 