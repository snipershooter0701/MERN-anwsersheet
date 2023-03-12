import { useState, useEffect } from 'react'
import { Container, Form, Row, Col, Table, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { createUser } from "../../store/reducers/userReducer";
import { useGoogleLogin } from "@react-oauth/google";
import { setLoading } from '../../store/reducers/userReducer'
import { Formik } from 'formik'
import * as yup from 'yup'
import Http from '../../services/Http'
import FormInput from '../../components/FormInput'
import { toast } from 'react-toastify'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import GoogleSvg from "../../assets/images/google.svg";
import SignUpSvg from '../../assets/images/Group-14629.svg'
import './PremiumSignUp.css'

const PremiumSignUp = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [membership, setMembership] = useState({})
  let user = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    paymentType: 'stripe'
  }
  useEffect(() => {
    document.title = 'AnswerSheet - HSC made easy'

    let membershipToPurchase = JSON.parse(
      window.localStorage.getItem('membership')
    )
    if (membershipToPurchase) {
      setMembership(membershipToPurchase)
    } else {
      navigate('/signup')
    }
  }, [])

  const validationSchema = yup.object({
    firstName: yup
      .string('Enter your first name.')
      .required('First name is required.'),
    lastName: yup
      .string('Enter your last name.')
      .required('Last name is required.'),
    email: yup
      .string('Enter your email.')
      .email('Enter a vaild email.')
      .required('Email is required.'),
    password: yup
      .string('Enter your password')
      .min(8, 'Password should be minimum 8 characters in length.')
      .required('Password is required.'),
    confirmPassword: yup
      .string()
      .test(
        'password-match',
        'Password and Confirm password do not match.',
        function (value) {
          return this.parent.password === value
        }
      )
  })
  const googleRegister = useGoogleLogin({
    onSuccess: async (tokenRes) => {
      let { data } = await Http.post("register/google", tokenRes);
      if (data.status) {
        // toast.success(data.msg);
        // await dispatch(createUser({
        //     user: data.user,
        //     token: data.token
        // }));
        // navigate("/subjects");
        await upgradeMembership({ ...data.user, paymentType: user.paymentType });
      } else {
        // toast.error(data.msg);
        dispatch(setLoading(false))
        toast.error(data.msg)
      }
    },
    onError: errRes => {
      console.log(errRes)
    }
  });
  const onRegister = async (user, { resetForm }) => {
    let { data } = await Http.post('premium-register', user);
    let premiumUser = {...data.user, gateway: 'stripe'};
    dispatch(setLoading(true));
    window.localStorage.setItem('premiumUser', JSON.stringify(premiumUser));
    window.localStorage.setItem('premiumMembership', JSON.stringify(membership));
    if (data.success) {
      toast.success(data.msg);
      // resetForm()
      // await upgradeMembership({ ...data.user, paymentType: user.paymentType })
    } else {
      dispatch(setLoading(false))
      toast.error(data.msg)
    }
  }
  const upgradeMembership = async user => {
    let { data } = await Http.post(`billing/${user.paymentType}`, {
      user,
      membership
    });
    if (data.success) {
      dispatch(setLoading(false))
      window.localStorage.removeItem('membership')
      window.location.href = data.redirect_url
      navigate('/current-membership');
    } else {
      dispatch(setLoading(false))
      toast.error(data.msg)
    }
  }

  return (
    <div className='premium-signup-container'>
      <Container>
        <div className='page-content'>
          <div className='page-left-content'>
            <img src={SignUpSvg} alt='Sign Up' />
          </div>
          <div className='page-right-content'>
            <Formik
              validationSchema={validationSchema}
              onSubmit={onRegister}
              initialValues={user}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({ handleSubmit, handleChange, values, touched, errors }) => (
                <Form noValidate onSubmit={handleSubmit}>
                  <div style={{ width: '100%' }} className='mb-3'>
                    <h1 className='page-title'>Join Answersheet Premium</h1>
                  </div>
                  {Object.keys(membership).length && (
                    <Table bsPrefix='bg-white table table-bordered'>
                      <thead
                        style={{ backgroundColor: '#005492', color: '#fafafa' }}
                      >
                        <tr>
                          <th>Premium membership</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div>
                              {membership.name} - {membership.subjects.length} {membership.subjects.length > 1 ? 'subjects' : 'subject'}
                            </div>
                            <ul className="mb-0">
                              {membership.subjects.map((subject, idx) =>
                                <li key={idx}>{subject.year_name} - {subject.name}</li>
                              )}
                            </ul>
                          </td>
                          <td>${membership.price}</td>
                        </tr>
                        <tr>
                          <td className='fw-bolder'>Total payment</td>
                          <td>${membership.price}</td>
                        </tr>
                      </tbody>
                    </Table>
                  )}
                  <Form.Group className='mb-3'>
                    <Form.Check
                      inline
                      type='radio'
                      name='paymentType'
                      value='stripe'
                      className="mr-5 mb-3"
                      label={
                        <>
                          <LazyLoadImage
                            src={require('../../assets/images/visa.png')}
                            alt='visa'
                            height='25'
                            className='mx-2'
                          />
                          <LazyLoadImage
                            src={require('../../assets/images/mastercard.png')}
                            alt='mastercard'
                            height='25'
                            className='mx-2'
                          />
                          <LazyLoadImage
                            src={require('../../assets/images/applepay.png')}
                            alt='applepay'
                            height='23'
                            className='mx-2'
                          />
                          <LazyLoadImage
                            src={require('../../assets/images/googlepay.png')}
                            alt='googlepay'
                            height='25'
                            className='mx-2'
                          />
                        </>
                      }
                      id='stripe'
                      checked={values.paymentType === 'stripe'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type='radio'
                      name='paymentType'
                      value='paypal'
                      label={
                        <LazyLoadImage
                          src={require('../../assets/images/paypal.png')}
                          height='24'
                          alt='paypal'
                        />
                      }
                      id='paypal'
                      checked={values.paymentType === 'paypal'}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <div style={{ width: '100%' }} className='mb-3'>
                    <h1 className='page-title'>Create an account</h1>
                  </div>
                  <FormInput
                    required
                    name='email'
                    className='mb-4'
                    icon='fa fa-envelope'
                    type='email'
                    placeholder='Email'
                    onChange={handleChange}
                    value={values.email}
                    errors={errors}
                  />
                  <Row>
                    <Col md='6' sm='12'>
                      <FormInput
                        required
                        name='firstName'
                        className='mb-4'
                        icon='fa fa-user'
                        type='text'
                        placeholder='First name'
                        onChange={handleChange}
                        value={values.firstName}
                        errors={errors}
                      />
                    </Col>
                    <Col md='6' sm='12'>
                      <FormInput
                        required
                        name='lastName'
                        className='mb-4'
                        icon='fa fa-user'
                        type='text'
                        placeholder='Last name'
                        onChange={handleChange}
                        value={values.lastName}
                        errors={errors}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md='6' sm='12'>
                      <FormInput
                        required
                        name='password'
                        className='mb-4'
                        icon='fa fa-lock'
                        type='password'
                        placeholder='Password'
                        onChange={handleChange}
                        value={values.password}
                        errors={errors}
                      />
                    </Col>
                    <Col md='6' sm='12'>
                      <FormInput
                        required
                        name='confirmPassword'
                        className='mb-4'
                        icon='fa fa-check'
                        type='password'
                        placeholder='Confirm password'
                        onChange={handleChange}
                        value={values.confirmPassword}
                        errors={errors}
                      />
                    </Col>
                  </Row>
                  <div className='d-grid'>
                    <Button
                      variant='primary'
                      type='submit'
                      className='float-end'
                    >
                      <i className='fa fa-sign-in'></i> Sign up and join
                    </Button>
                  </div>
                  <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ flex: 1 }}><hr /></div>
                    <div className="py-2 px-3 fw-bold text-dark">OR</div>
                    <div style={{ flex: 1 }}><hr /></div>
                  </div>
                  <div className="d-grid">
                    <Button variant="primary" className="google-signup-btn" type="button" onClick={googleRegister}>
                      <LazyLoadImage src={GoogleSvg} alt="google" /> Sign up with Google and join
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default PremiumSignUp
