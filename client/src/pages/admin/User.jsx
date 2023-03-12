import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Http from '../../services/Http'
import { Card, Table, Form, Row, Col, Button, Modal, Accordion, InputGroup } from 'react-bootstrap'
import { Formik } from 'formik'
import * as yup from 'yup'
import moment from 'moment'
import { toast } from 'react-toastify'
import './User.css';

const User = () => {
  const params = useParams()
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '' });
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [years, setYears] = useState([]);
  const [userMemberships, setUserMemberships] = useState({});
  const [memberships, setMemberships] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [editMembershipId, setEditMembershipId] = useState('');
  const [selectedMembership, setSelectedMembership] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState('');
  const [invoiceIsOpen, setInvoiceIsOpen] = useState(false);
  const [invoiceIsEdited, setInvoiceIsEdited] = useState(false);
  const [removeInvoiceIdx, setRemoveInvoiceIdx] = useState(0);
  const [removeMembershipIdx, setRemoveMembershipIdx] = useState(0);
  const [invoiceIdx, setInvoiceIdx] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [newInvoices, setNewInvoices] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editInvoices, setEditInvoices] = useState([]);
  const [invoice, setInvoice] = useState({});
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [membershipIsOpen, setMembershipIsOpen] = useState(false);
  const [membershipIsEdited, setMembershipIsEdited] = useState(false);
  const [membershipIdx, setMembershipIdx] = useState(0);
  const [membership, setMembership] = useState({});
  const [membershipModalShow, setMembershipModalShow] = useState(false);
  const [membershipModalContent, setMembershipModalContent] = useState({});
  const [removeModalIsOpen, setRemoveModalIsOpen] = useState(false);
  const [removeType, setRemoveType] = useState('');

  const validationProfileSchema = yup.object({
    firstName: yup.string().required('First name is required.'),
    lastName: yup.string().required('Last name is required.'),
    email: yup
      .string()
      .email('Enter a vaild email.')
      .required('Email is required.')
  });
  const validationPasswordsSchema = yup.object({
    password: yup
      .string()
      .required('Password is required.')
      .min(8, 'Password should be minimum 8 characters in length.')
      .required('Password is required.'),
    confirmPassword: yup
      .string()
      .test('password-match', 'Password and Confirm password do not match.', function (value) {
        return this.parent.password === value
      })
  })
  const validationInvoiceSchema = yup.object({
    paidDate: yup.date('Enter paid date.')
      .required('Please enter a name.'),
    subtotal: yup.number()
      .required('Required field.')
  });

  useEffect(() => {
    const getUser = async () => {
      let id = params.id
      let { data } = await Http.get(`admin/users/${id}`)
      setUser({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email
      });
      setUserMemberships(data.memberships)
      setInvoices(data.invoices)
    }
    getUser()
  }, []);
  useEffect(() => {
    const getYears = async () => {
      let { data } = await Http.get('years')
      if (data.success) {
        setYears(data.data)
      } else {
        toast.error(data.msg)
      }
    }
    getYears()
  }, [])
  useEffect(() => {
    const getNewInvoices = async () => {
      let { id } = params;
      let { data } = await Http.get(`invoices/get-new-invoices/${id}`);
      setNewInvoices(data);
    }
    getNewInvoices();
  }, [])
  useEffect(() => {
    const getMemberships = async () => {
      let { data } = await Http.get('memberships');
      if (data.success) {
        setMemberships(data.memberships)
      } else {
        toast.error(data.msg)
      }
    }
    getMemberships()
  }, [])

  const selectSubject = (_subject, year) => {
    let subjects = selectedSubjects;
    let find = subjects.findIndex(subject => subject._id === _subject._id);
    // let find = subjects.indexOf(subject)
    if (find > -1) {
      subjects.splice(find, 1)
    } else {
      // subject.year_name = year.name;
      subjects.push(_subject)
    }
    setSelectedSubjects([...subjects]);
  }
  const isSelectedSubject = _subject => {
    if (selectedSubjects.findIndex(subject => subject._id === _subject._id) === -1) {
      return false
    } else {
      return true
    }
  }
  const updateProfile = async (user, { resetForm }) => {
    let { data } = await Http.put(`admin/users/${params.id}`, user);
    if (data.status) {
      toast.success(data.msg);
    } else {
      toast.error(data.msg);
    }
  }
  const updatePassword = async (passwords, { resetForm }) => {
    let { data } = await Http.put(`admin/users/${params.id}/password`, {
      password: passwords.password
    });
    if (data.status) {
      resetForm();
      toast.success(data.msg);
    } else {
      toast.error(data.msg);
    }
  }

  const onAddInvoice = async (invoice_, { resetForm }) => {
    invoice_.status = false;
    let { data } = await Http.post(`admin/users/${params.id}/invoice`, invoice_);
    if (data.success) {
      toast.success(data.msg);
      setInvoices([...invoices, data.data]);
      setEditInvoices([...editInvoices, data.data]);
      setNewInvoices([...newInvoices, data.data]);
      resetForm();
      setInvoiceIsOpen(false);
    } else {
      toast.error(data.msg);
    }
  }
  const viewInvoice = idx => {
    setInvoice(invoices[idx]);
    setInvoiceModalOpen(true);
  }
  const onEditInvoice = async (invoice_, { resetForm }) => {
    let { data } = await Http.put(`admin/users/${params.id}/invoice`, invoice_);
    if (data.success) {
      toast.success(data.msg);
      let newInvoices = invoices.map((_invoice, idx) => {
        if (idx === invoice_.invoiceIdx) {
          return data.data
        } else {
          return _invoice;
        }
      });
      setInvoices(newInvoices);
      resetForm();
      setInvoiceIsOpen(false);
    } else {
      toast.error(data.msg);
    }
  }
  const invoiceModal = (isEdited, idx) => {
    setInvoiceIsEdited(isEdited);
    setInvoiceIdx(idx);
    setInvoiceIsOpen(true);
  }
  const removeInvoice = async (idx) => {
    let invoiceId = invoices[idx]._id;
    let { data } = await Http.delete(`admin/users/${params.id}/invoice/${invoiceId}`);
    if (data.success) {
      toast.success(data.msg);
      let temp = invoices;
      temp.splice(idx, 1)
      setInvoices(temp);
      setRemoveModalIsOpen(false);
    } else {
      toast.error(data.msg);
    }
  }

  const addMembership = async () => {
    if (selectedInvoice == '') {
      toast.error("No invoice is available.");
    } else if (selectedSubjects.length == 0) {
      toast.error("Please select subjects.");
    } else if (selectedMembership.length == 0) {
      toast.error("Please select membership.");
    } else {
      let { data } = await Http.post(`admin/users/${params.id}/membership`, {
        selectedSubjects,
        selectedInvoice,
        currentInvoice,
        selectedMembership
      });
      if (data.success) {
        toast.success(data.msg);
        setUserMemberships(data.data);
        let temp = newInvoices;
        temp.length && temp.map((invoice, idx) => {invoice._id === selectedInvoice && temp.splice(idx, 1)});
        setNewInvoices(temp);
        
        onHideMembershipModal();
      } else {
        toast.error(data.msg);
        onHideMembershipModal();
      }
    }
  }

  const editMembership = async () => {
    if (selectedInvoice == '') {
      toast.error("No invoice is available.");
    } else if (selectedSubjects.length == 0) {
      toast.error("Please select subjects.");
    } else if (selectedMembership.length == 0) {
      toast.error("Please select membership.");
    } else {
      let { data } = await Http.put(`admin/users/${params.id}/membership`, {
        selectedSubjects,
        selectedInvoice,
        currentInvoice,
        selectedMembership,
        editMembershipId
      });
      if (data.success) {
        toast.success(data.msg);
        setUserMemberships(data.data);
        let temp = newInvoices;
        temp.map((newInvoice, idx) => newInvoice._id === selectedInvoice && temp.splice(idx, 1));
        editInvoices.map((editInvoice, idx) => editInvoice._id === currentInvoice && temp.push(editInvoice));
        setNewInvoices(temp);
        onHideMembershipModal();
      } else {
        toast.error(data.msg);
        onHideMembershipModal();
      }
    }
  }
  const membershipModal = (isEdited, idx, _membership) => {
    setMembershipIsEdited(isEdited);
    setMembershipIdx(idx);
    setMembershipIsOpen(true);
    if (isEdited) {
      setIsEdit(true);
      setSelectedMembership(_membership.membership_id);
      setEditInvoices([...newInvoices, _membership.invoice]);
      setSelectedInvoice(_membership.invoice._id);
      setSelectedSubjects([..._membership.subjects]);
      setEditMembershipId(_membership._id);
      setCurrentInvoice(_membership.invoice._id);
    } else if (newInvoices.length) {
      setIsEdit(false);
      setSelectedInvoice(newInvoices[0]._id);
      setSelectedMembership(memberships[0]._id);
    }
  }
  const removeMembership = async (membershipId) => {
    let { data } = await Http.delete(`admin/users/${params.id}/membership/${membershipId}`);
    if (data.success) {
      toast.success(data.msg);
      setUserMemberships(data.memberships);
      setRemoveModalIsOpen(false);
    } else {
      toast.error(data.msg);
    }
  }

  const onHideMembershipModal = () => {
    setIsEdit(false);
    setSelectedInvoice('');
    setSelectedMembership('');
    setSelectedSubjects([]);
    setEditInvoices([]);
    setMembershipIsOpen(false)
  }
  const removeModal = (type, idx) => {
    setRemoveType(type)
    type === 'invoice' && setRemoveInvoiceIdx(idx);
    type === 'membership' && setRemoveMembershipIdx(idx);
    setRemoveModalIsOpen(true);
  }
  const onMembershipModalBtn = (idx) => {
    setMembershipModalShow(true);
    setMembershipModalContent(userMemberships[idx]);
  }

  return (
    <Row gutter={15}>
      <Col md={6}>
        <Card className='mb-4'>
          <Card.Header
            style={{ background: '#3c4b64' }}
            bsPrefix='card-header py-3'
          >
            <Card.Title as='h1' style={{ fontSize: 24 }} bsPrefix='mb-0 card-title text-light'>
              User profile
            </Card.Title>
          </Card.Header>
          <Card.Body className='p-4'>
            <Formik
              enableReinitialize={true}
              validationSchema={validationProfileSchema}
              validateOnChange={false}
              validateOnBlur={false}
              onSubmit={updateProfile}
              initialValues={user}
            >
              {({ handleSubmit, handleChange, values, touched, errors }) => (
                <Form noValidate onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className='mb-3'>
                        <Form.Label>First name:</Form.Label>
                        <Form.Control
                          type='text'
                          name='firstName'
                          onChange={handleChange}
                          value={values.firstName}
                          isInvalid={!!errors.firstName}
                          touched={touched}
                        />
                        <Form.Control.Feedback type='invalid'>
                          {errors.firstName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className='mb-3'>
                        <Form.Label>Last name:</Form.Label>
                        <Form.Control
                          type='text'
                          name='lastName'
                          onChange={handleChange}
                          value={values.lastName}
                          isInvalid={!!errors.lastName}
                          touched={touched}
                        />
                        <Form.Control.Feedback type='invalid'>
                          {errors.lastName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className='mb-3'>
                        <Form.Label>Email:</Form.Label>
                        <Form.Control
                          type='email'
                          name='email'
                          onChange={handleChange}
                          value={values.email}
                          isInvalid={!!errors.isInvalid}
                          touched={touched}
                        />
                        <Form.Control.Feedback type='invalid'>
                          {errors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button type="submit" variant='primary' style={{ float: 'right' }}>
                    Update profile
                  </Button>
                </Form>
              )}
            </Formik>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6}>
        <Card className='mb-4'>
          <Card.Header
            style={{ background: '#3c4b64' }}
            bsPrefix='card-header py-3'
          >
            <Card.Title as='h1' style={{ fontSize: 24 }} bsPrefix='mb-0 card-title text-light'>
              Change password
            </Card.Title>
          </Card.Header>
          <Card.Body className='p-4'>
            <Formik
              enableReinitialize={true}
              validationSchema={validationPasswordsSchema}
              validateOnChange={false}
              validateOnBlur={false}
              onSubmit={updatePassword}
              initialValues={passwords}
            >
              {({ handleSubmit, handleChange, values, touched, errors }) => (
                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Group className='mb-3'>
                    <Form.Label>New password:</Form.Label>
                    <Form.Control
                      type='password'
                      name="password"
                      onChange={handleChange}
                      value={values.password}
                      isInvalid={!!errors.password}
                      touched={touched}
                    />
                    <Form.Control.Feedback type='invalid'>{errors.password}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Confirm password:</Form.Label>
                    <Form.Control
                      type='password'
                      name="confirmPassword"
                      onChange={handleChange}
                      value={values.confirmPassword}
                      isInvalid={!!errors.confirmPassword}
                      touched={touched} />
                    <Form.Control.Feedback type='invalid'>{errors.confirmPassword}</Form.Control.Feedback>
                  </Form.Group>
                  <Button type="submit" variant='primary' style={{ float: 'right' }}>
                    Change password
                  </Button>
                </Form>
              )}
            </Formik>
          </Card.Body>
        </Card>
      </Col>
      <Col md={12}>
        <Card className='mb-4'>
          <Card.Header
            style={{ background: '#3c4b64' }}
            bsPrefix='card-header py-3'
          >
            <Card.Title as='h1' style={{ fontSize: 24 }} bsPrefix='mb-0 card-title text-light'>
              Invoice histories
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Table bordered hover className='text-center mb-0'>
              <thead
                style={{
                  background: '#3c4b64',
                  color: '#fafafa',
                  borderColor: 'rgb(44 56 74 / 95%)'
                }}
              >
                <tr>
                  <th>Invoice number</th>
                  <th>Actions</th>
                  <th>Amount</th>
                  <th>Paid date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length ? (
                  invoices.map((invoice, idx) => (
                    <tr key={idx}>
                      <td>INV-{invoice.invoice_id}</td>
                      <td>
                        <Button variant="success" size="sm" className="me-1" onClick={() => viewInvoice(idx)}><i className="fa fa-eye"></i></Button>
                        <Button variant="primary" size="sm" className="me-1" onClick={() => invoiceModal(true, idx)}><i className="fa fa-edit"></i></Button>
                        <Button variant="danger" size="sm" className="me-1" onClick={() => removeModal('invoice', idx)}><i className="fa fa-trash"></i></Button>
                      </td>
                      <td>${invoice.amount}</td>
                      <td>
                        {moment(invoice.paid_date).format(
                          'YYYY.MM.DD HH:mm:ss'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className='text-danger'>
                      Empty invoices
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => invoiceModal(false)}>
              <i className="fa fa-plus"></i> Add invoice</Button>
          </Card.Body>
        </Card>
      </Col>
      <Col md={12}>
        <Card className='mb-4'>
          <Card.Header
            style={{ background: '#3c4b64' }}
            bsPrefix='card-header py-3'
          >
            <Card.Title as='h1' style={{ fontSize: 24 }} bsPrefix='mb-0 card-title text-light'>
              Current memberships
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Table bsPrefix='table table-bordered' className='text-center'>
              <thead
                style={{
                  background: '#3c4b64',
                  color: '#fafafa',
                  borderColor: 'rgb(44 56 74 / 95%)'
                }}
              >
                <tr>
                  <th>Subjects</th>
                  <th>Invoice Number</th>
                  <th>Current Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className='text-center'>
                {userMemberships.length ? (
                  userMemberships.map((membership, idx) => {
                    return (
                      <tr key={idx}>
                        <td>
                          <ul className='mb-0' style={{ listStyleType: 'none' }}>
                            {membership.subjects && membership.subjects.map((subject, idx) => (
                              <li key={idx}>
                                {subject.year.name} - {subject.name}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>INV-{membership.invoice.invoice_id}</td>
                        <td style={{ verticalAlign: 'middle' }}>
                          {Number(membership.period) === -1 ? '-' : (Number(membership.period) === 3 ? moment(membership.createdAt).add(3, 'months').format('YYYY.MM.DD HH:mm:ss') : moment(membership.createdAt).add(12, 'months').format('YYYY.MM.DD HH:mm:ss'))}
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <Button variant="success" size="sm" className="me-1" onClick={() => onMembershipModalBtn(idx)}><i className="fa fa-eye"></i></Button>
                          <Button variant="primary" size="sm" className="me-1" onClick={() => membershipModal(true, idx, membership)}><i className="fa fa-edit"></i></Button>
                          <Button variant="danger" size="sm" className="me-1" onClick={() => removeModal('membership', membership._id)}><i className="fa fa-trash"></i></Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className='text-danger'>
                      Empty memberships
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Button variant="primary" size="sm" onClick={() => membershipModal(false)}><i className="fa fa-plus"></i> Add membership</Button>
          </Card.Body>
        </Card>
      </Col>
      <Modal
        show={membershipIsOpen}
        onHide={() => setMembershipIsOpen(false)}
        centered
        size='lg'
        className='add-modal'
      >
        <Modal.Body className='p-4'>
          <Modal.Title as='h3' className='mb-2'>
            {membershipIsEdited ? "Edit" : "Add"} membership
          </Modal.Title>
          <div>
            <p className='fs-5 fw-400 mb-1'>Subject(s)</p>
            <Accordion defaultActiveKey={-1}>
              {years.map((year, idx) => (
                <Accordion.Item key={idx} eventKey={idx}>
                  <Accordion.Header>{year.name}</Accordion.Header>
                  <Accordion.Body>
                    <ul className='mb-0 nav flex-column'>
                      {year.subjects.map((subject, idx) => (
                        <li
                          key={idx}
                          className='py-2'
                          onClick={() => selectSubject(subject, year)}
                          style={{ cursor: 'pointer' }}
                        >
                          {subject.name}
                          <Form.Check
                            inline
                            name='subjects'
                            className='float-end'
                            checked={isSelectedSubject(subject) ? true : false}
                            value={subject}
                            onChange={() => { }}
                          />
                        </li>
                      ))}
                    </ul>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
          <Row className="mb-3">
            <Col sm={12} lg={6}>
              <Form.Select
                name="continue-until"
                value={selectedMembership}
                onChange={ev => setSelectedMembership(ev.target.value)}
                className="mb-2"
              >
                {memberships.length && memberships.map((membership, idx) => <option key={idx} value={membership._id}>{membership.name}</option>)}
              </Form.Select>
            </Col>
            <Col sm={12} lg={6}>
              <Form.Select
                name="link-invoice"
                className="mb-2"
                value={selectedInvoice}
                onChange={isEdit ? (ev) => {setSelectedInvoice(ev.target.value);} : (ev) => setSelectedInvoice(ev.target.value)}
              >
                {isEdit ? editInvoices.map((invoice, idx) => <option key={idx} value={invoice._id}>INV-{invoice.invoice_id}</option>) : newInvoices.map((invoice, idx) => <option key={idx} value={invoice._id}>INV-{invoice.invoice_id}</option>)}
                {/* {newInvoices.map((invoice, idx) => <option key={idx} value={invoice._id}>INV-{invoice.invoice_id}</option>)} */}
              </Form.Select>
            </Col>
          </Row>
          <Button variant="primary" className="form-control" onClick={membershipIsEdited ? editMembership : addMembership}>{membershipIsEdited ? 'Edit' : 'Add'} membership</Button>
          <button
            className='btn-close'
            onClick={() => setMembershipIsOpen(false)}
          ></button>
        </Modal.Body>
      </Modal>
      <Modal
        show={invoiceIsOpen}
        onHide={() => setInvoiceIsOpen(false)}
        centered
        size='lg'
        className='add-modal'
      >
        <Modal.Body className='p-4'>
          <Modal.Title as='h3' className='mb-2'>
            {invoiceIsEdited ? "Edit" : "Add"} invoice
          </Modal.Title>
          <Formik
            validationSchema={validationInvoiceSchema}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={invoiceIsEdited ? onEditInvoice : onAddInvoice}
            initialValues={{
              invoiceIdx: invoiceIdx,
              invoiceId: invoiceIsEdited ? invoices[invoiceIdx]._id : null,
              itemName: invoiceIsEdited ? invoices[invoiceIdx].item_name : '3 Months Membership',
              paidDate: invoiceIsEdited ? moment(invoices[invoiceIdx].paid_date).format('yyyy-MM-DD HH:mm:SS') : moment(new Date()).format('yyyy-MM-DDTHH:mm:SS'),
              isPaid: invoiceIsEdited ? (invoices[invoiceIdx].paid_date ? 'paid' : 'notPaid') : 'paid',
              invoiceDescription: invoiceIsEdited ? invoices[invoiceIdx].item_description : '',
              subtotal: invoiceIsEdited ? invoices[invoiceIdx].amount : 0
            }}
            enableReinitialize={true}
          >
            {({ handleSubmit, handleChange, handleBlur, values, touched, errors }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group>
                  <Form.Select
                    className="mb-3"
                    name="itemName"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.itemName}
                    touched={touched}
                    isInvalid={!!errors.itemName}>
                    {memberships.length && memberships.map((membership, idx) => {
                      return <option key={idx} value={membership.name}>{membership.name}</option>
                    })}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.itemName}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>Paid date</InputGroup.Text>
                    <Form.Control
                      type="datetime-local"
                      name="paidDate"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.paidDate}
                      touched={touched}
                      isInvalid={!!errors.paidDate} />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.paidDate}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                  <Form.Select
                    className="mb-3"
                    name="isPaid"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.isPaid}
                    touched={touched}
                    isInvalid={!!errors.isPaid}>
                    <option value="paid">Paid</option>
                    <option value="notPaid">Not paid</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.isPaid}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    as="textarea"
                    placeholder="Please enter a description"
                    name="invoiceDescription"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.invoiceDescription}
                    rows="4"
                    touched={touched}
                  />
                </Form.Group>
                <Form.Group>
                  <InputGroup className="mb-3">
                    <InputGroup.Text style={{ width: 40 }}><i className="fa fa-dollar"></i></InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="subtotal"
                      onChange={handleChange}
                      value={values.subtotal}
                      isInvalid={!!errors.subtotal}
                      touched={touched}
                      placeholder="Subtotal"
                      onBlur={handleBlur}
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.subtotal}</Form.Control.Feedback>
                </Form.Group>
                <Button variant="primary" type="summit" className="form-control">{invoiceIsEdited ? 'Edit' : 'Add'} invoice</Button>
              </Form>
            )}
          </Formik>
          <button
            className='btn-close'
            onClick={() => setInvoiceIsOpen(false)}
          ></button>
        </Modal.Body>
      </Modal>
      <Modal show={removeModalIsOpen} className="remove-modal">
        <Modal.Body>
          <Modal.Title>
            <h1 style={{ fontSize: 24 }}>Are you sure?</h1>
          </Modal.Title>
          <p>You are going to remove an invoice. Continue?</p>
          <Form.Group style={{ float: 'right' }}>
            <Button size="sm" variant="danger" className="me-2" onClick={removeType === 'invoice' ? () => removeInvoice(removeInvoiceIdx) : () => removeMembership(removeMembershipIdx)}>Yes</Button>
            <Button size="sm" variant="primary" onClick={() => setRemoveModalIsOpen(false)}>No</Button>
          </Form.Group>
          <button
            className='btn-close'
            onClick={() => setRemoveModalIsOpen(false)}
          ></button>
        </Modal.Body>
      </Modal>
      <Modal show={invoiceModalOpen} className="view-modal" size="xl">
        <Modal.Body>
          <Modal.Title>
            <h1>Tax Invoice</h1>
          </Modal.Title>
          {
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between invoice-content">
                  <div className="invoice-to mb-2">
                    <h5 className="text-dark">To</h5>
                    <h5>{invoice.item_name}</h5>
                    <div className="description-items">
                      <div className="description-item">
                        <div className="description-item-name">Invoice number</div>
                        <div className="description-item-value">{"INV-" + invoice.invoice_id}</div>
                      </div>
                      <div className="description-item">
                        <div className="description-item-name">Paid date</div>
                        <div className="description-item-value">{moment(invoice.paid_date).format("DD MMM YYYY")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="invoice-from mb-2">
                    <h5 className="text-dark">From</h5>
                    <Row>
                      <Col>
                        <h5>{invoice.company}</h5>
                        <p className="mb-0">{invoice.address}</p>
                      </Col>
                      <Col>
                        <h5>All billing enquiries</h5>
                        <p className="mb-0">{invoice.email}</p>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Card.Body>
            </Card>
          }
          <Card>
            {
              <Card.Body className="p-4 item-description-container">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="item-description-title"><img style={{ verticalAlign: "middle" }} src={require("../../assets/images/bar_sort_icon.png")} height="14" alt="Bar Sort" className="me-2" /> Item description</div>
                  <div className="item-description-title"><img style={{ verticalAlign: "middle" }} src={require("../../assets/images/card_icon.png")} height="25" alt="Card" className="me-2" /> Amount</div>
                </div>
                <div className="d-flex justify-content-between item-description-content mb-4">
                  <div>
                    <p className="mb-1">{invoice.item_name}</p>
                    <p>{invoice.item_description}</p>
                  </div>
                  <div>{Number(invoice.amount - invoice.gst).toFixed(2)}</div>
                </div>
                <div className="invoice-billing-info">
                  <div className="invoice-billing-left-info">
                    <div>
                      <div>Sub total</div>
                      <div>{Number(invoice.amount - invoice.gst).toFixed(2)}</div>
                    </div>
                    <div>
                      <div>Total GST 10%</div>
                      <div>{Number(invoice.gst).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="invoice-billing-right-info">
                    <div>Amount due aus</div>
                    <div>{Number(invoice.amount).toFixed(2)}</div>
                  </div>
                </div>
              </Card.Body>
            }
          </Card>
          <button
            className='btn-close'
            onClick={() => setInvoiceModalOpen(false)}
          ></button>
        </Modal.Body>
      </Modal>
      <Modal show={membershipModalShow} className="membership-view-modal" size="md">
        {console.log(membershipModalContent)}
        <Modal.Body>
          <Modal.Title>
            <h1>{membershipModalContent.name}</h1>
          </Modal.Title>
          <Card className="mb-2">
            <Card.Body>
              <p><b>Invoice: </b> INV-{membershipModalContent.length && membershipModalContent.invoice.invoice_id}</p>
              <hr />
              <p><b>Subjects: </b></p>
              <ul>
                { membershipModalContent.length &&
                  membershipModalContent.subjects.map((subject, idx) => {
                    return <li>{subject.year.name} - {subject.name}</li>
                  })
                }
              </ul>
              <hr />
              <p><b>Price: </b>${membershipModalContent.price}</p>
              <p><b>Current until: </b>{moment(membershipModalContent.createdAt).add(Number(membershipModalContent.period), 'months').format('YYYY-MM-DD HH:mm:ss')}</p>
            </Card.Body>
          </Card>
          <Button className="btn-secondary" onClick={() => setMembershipModalShow(false)}>Close</Button>
          <button
            className='btn-close'
            onClick={() => setMembershipModalShow(false)}
          ></button>
        </Modal.Body>
      </Modal>
    </Row>
  )
}

export default User
