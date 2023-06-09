import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createUser } from "../../store/reducers/userReducer";
import { toast } from "react-toastify";
import { Formik } from "formik";
import * as yup from "yup";
import { Container, Form, Button } from "react-bootstrap";
import FormInput from "../../components/FormInput";
import { useGoogleLogin } from "@react-oauth/google";
import { LazyLoadImage } from "react-lazy-load-image-component";
import LoginSvg from "../../assets/images/Group-14630.png";
import GoogleSvg from "../../assets/images/google.svg";
import Http from "../../services/Http";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [wrongCount, setWrongCount] = useState(0);
    const [leftSeconds, setLeftSeconds] = useState(60);
    const [myInterval, setMyInterval] = useState({});

    useEffect(() => {
        document.title = "AnswerSheet - Login"
        let temp = window.localStorage.getItem('leftSeconds') ?? 60;
        if (temp < 60 && temp > 0) {
            setWrongCount(5);
            setLeftSeconds(temp);
        }
    }, []);
    let user = { email: "", password: "" };

    const validationSchema = yup.object({
        email: yup.string('Enter your email.')
                .email('Enter a valid email.')
                .required('Email is required.'),
        password: yup.string('Enter your password.')
                .required('Password is required.')
    });

    const onLogin = async (user, { resetForm }) => {
        let { data } = await Http.post("login", user);
        if (data.status) {
            resetForm();
            toast.success(data.msg);
            await dispatch(createUser({
                user: data.user,
                token: data.token
            }));
            if (data.user.role > 0) {
                navigate("/admin/users");
            } else {
                navigate("/subjects");
            }
        } else {
            if (data.wrongInfo) {
                setWrongCount(prev => prev + 1);
            }
            if (wrongCount < 5) {
                toast.error(data.msg);
            }
        }
    }

    useEffect(() => {
        if (wrongCount == 5) {
            setLeftSeconds(60);
            let myInterval = setInterval(() => setLeftSeconds(prev => prev - 1), 1000);
            setMyInterval(myInterval);
        } else {
            return;
        } 
    }, [wrongCount]);

    useEffect(() => {
        if (leftSeconds < 0) {
            setMyInterval(clearInterval(myInterval));
            setWrongCount(0);
            window.localStorage.setItem('leftSeconds', 0);
        }
        window.localStorage.setItem('leftSeconds', leftSeconds);
    }, [leftSeconds]);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenRes) => {
            let { data } = await Http.post("login/google", tokenRes);
            if (data.status) {
                toast.success(data.msg);
                await dispatch(createUser({
                    user: data.user,
                    token: data.token
                }));
                if (data.user.role > 0) {
                    navigate("/admin/users");
                } else {
                    navigate("/subjects");
                }
            } else {
                toast.error(data.msg);
            }
        },
        onError: errRes => {
            toast.error(errRes.toString());
        }
    })

    return (
        <div className="login-container">
            <Container>
                <div className="page-content">
                    <div className="page-left-content">
                        <LazyLoadImage src={LoginSvg} alt="Login"/>
                    </div>
                    <div className="page-right-content">
                        <div className="login-form">
                            {
                                wrongCount > 4 && leftSeconds > 0 ? <p className="text-danger">Try again after {leftSeconds} seconds.</p> : null
                            }
                            <h1 className="page-title">Welcome back</h1>
                            <Formik
                                validationSchema={validationSchema}
                                validateOnChange={false}
                                validateOnBlur={false}
                                onSubmit={onLogin}
                                initialValues={user}
                            >
                                {({handleSubmit, handleChange, values, touched, errors}) => (
                                    <Form noValidate onSubmit={handleSubmit} className="mt-4">
                                        <div className="d-grid">
                                            <Button variant="primary" className="google-signin-btn" onClick={googleLogin} disabled={leftSeconds > 0 && wrongCount > 4}>
                                                <LazyLoadImage src={GoogleSvg} alt="google" style={{ marginRight: 15 }}/>
                                                Sign in with Google
                                            </Button>
                                        </div>
                                        <div style={{display: "flex", alignItems: 'center', justifyContent: 'center'}}>
                                            <div style={{flex: 1}}><hr/></div>
                                            <div className="py-2 px-3 fw-bold text-dark">OR</div>
                                            <div style={{flex: 1}}><hr/></div>
                                        </div>
                                        <p className="mb-4">Please enter your details.</p>
                                        <FormInput 
                                            className="mb-4"
                                            required
                                            name="email"
                                            icon="fa fa-envelope" 
                                            type="email" 
                                            placeholder="Email"
                                            onChange={handleChange}
                                            value={values.email}
                                            touched={touched}
                                            errors={errors}
                                            disabled={leftSeconds > 0 && wrongCount > 4}
                                            />
                                        <FormInput 
                                            className="mb-3" 
                                            required
                                            name="password" 
                                            icon="fa fa-lock" 
                                            type="password" 
                                            placeholder="Password"
                                            onChange={handleChange}
                                            value={values.password}
                                            touched={touched}
                                            errors={errors}
                                            disabled={leftSeconds > 0 && wrongCount > 4}
                                            />
                                        <p className="mb-1">Don't have an account? <Link className="" to="/signup">Sign up free</Link></p>
                                        <p className="mb-4"><Link className="" to="/forgot-password">Forgot password?</Link></p>
                                        <div className="d-grid">
                                            <Button variant="primary" type="submit" disabled={leftSeconds > 0 && wrongCount > 4}>Log in</Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default Login;