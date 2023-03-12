import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createUser } from "../../store/reducers/userReducer";
import { setLoading } from "../../store/reducers/userReducer";
import { Container } from "react-bootstrap";
import { toast } from "react-toastify";
import Http from "../../services/Http";

const PremiumVerifyEmail = () => {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { premiumUser, premiumMembership, loading } = useSelector(state => state.user);

    useEffect(() => {
        document.title = "AnswerSheet - HSC made easy"
        const abortController = new AbortController();
        setPremiumVerifyEmail(abortController.signal);
        return () => abortController.abort();
    }, []);

    const setPremiumVerifyEmail = async (signal) => {
        dispatch(setLoading(true));
        let { data } = await Http.get(`verify-email/${token}`, { signal });
        if (data.status) {
          dispatch(setLoading(false));
          toast.success(data.msg);
          await dispatch(createUser({
              user: data.user,
              token: data.token
          }));
            // navigate("/subjects");
          upgradeMembership();
        } else {
            toast.error(data.msg);
            navigate("/login")
        }
    }
    const upgradeMembership = async () => {
      let { data } = await Http.post(`billing/${premiumUser.gateway}`, {
        user: premiumUser,
        membership: premiumMembership
      });
      if (data.success) {
        dispatch(setLoading(false));
        window.localStorage.removeItem('membership')
        window.location.href = data.redirect_url
      } else {
        dispatch(setLoading(false))
        toast.error(data.msg)
      }
    }
    return (
        <div className="page-container d-flex align-items-center justify-content-center">
            <Container className="text-center">
              {loading && 
                <span className="alert alert-success">Please wait while verifing your email...</span>}
            </Container>
        </div>
    )
}

export default PremiumVerifyEmail;