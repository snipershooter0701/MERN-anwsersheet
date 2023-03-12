    import { useState, useEffect } from "react";
    import { Link } from "react-router-dom";
    import { Card, Modal, Form, Button } from "react-bootstrap";
    import { Formik } from "formik";
    import * as yup from "yup";
    import DataTable from "../../components/DataTable";
    import Http from "../../services/Http";

    const Seo = () => {
        const [isGetData, setIsGetData] = useState(false);
        const [data, setData] = useState([]);
        const [sort, setSort] = useState();
        const [search, setSearch] = useState("");
        const [pagination, setPagination] = useState({ page: 1, totalCount: 0, pageSize: 10 });
        const [seo, setSeo] = useState({
            title: "",
            description: "",
            keywords: "",
            author: "",
            summary: "",
            other: ""
        })

        const validationSchema = yup.object({
            page: yup.string().required("Please choose a page."),
            description: yup.string().required("Please enter a description"),
            keywords: yup.string().required("Please enter a keywords"),
            author: yup.string("Please enter an author")
        })

        const columns = [{
            key: "_id",
            name: "No",
            width: 65,
            render:(rowData, idx) => idx + 1
        }, {
            key: "title",
            name: "Title",
            render: (rowData, idx) => {
                return <Link to={`/${rowData.topic.module.subject.year.slug}/${rowData.topic.module.subject.slug}/${rowData.topic.module.slug}/${rowData.topic.slug}/${rowData.slug}`}>{rowData.meta.title}</Link>
            }
        }, {
            key: "description",
            name: "Description",
            render: (rowData, idx) => rowData.meta.description
        }, {
            key: "keywords",
            name: "keywords",
            render: (rowData, idx) => rowData.meta.keywords
        }, {
            key: "author",
            name: "Author",
            render: (rowData, idx) => rowData.meta.author
        }];

        useEffect(() => {
            (async () => {
                let { data } = await Http.get("admin/sub-topics", {
                    params: {
                        search: search,
                        length: pagination.pageSize,
                        page: pagination.page,
                        sortKey: sort ? sort.key : "",
                        sortDir: sort ? sort.dir : ""
                    }
                });
                setData(data.data);
            })();
        }, [isGetData]);

        const onChange = ({search, pagination, sort}) => {
            setSort(sort);
            setSearch(search);
            setPagination(pagination);
            setIsGetData(!isGetData);
        }

        const onSave = (seo) => {

        }
        return (
            <Card>
                <Card.Header
                    style={{ background: '#3c4b64' }}
                    bsPrefix="card-header py-3"
                >
                    <Card.Title as="h5" bsPrefix="mb-0 card-title text-light">
                        Seo management
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <DataTable
                        columns={columns}
                        data={data}
                        sort={sort}                
                        search={search}
                        pagination={pagination}
                        onChange={onChange}
                    />
                    <Modal show={false}>
                        <Modal.Header>
                            <Modal.Title>New SEO meta data</Modal.Title>
                        </Modal.Header>
                        <Formik
                            validationSchema={validationSchema}
                            validateOnChange={false}
                            validateOnBlur={false}
                            onSubmit={onSave}
                            initialValues={seo}
                        >
                            {({ handleSubmit, handleChange, handleBlur, values, touched, errors }) => (
                                <Form noValidate onSubmit={handleSubmit}>
                                    <Modal.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Select 
                                                name="year" 
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.year}
                                                touched={touched}
                                                isInvalid={!!errors.year}
                                            >
                                                {/* {pages.map((page, idx) => <option key={idx} value={page._id}>{page.name}</option>)} */}
                                            </Form.Select>
                                        </Form.Group>
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button variant="primary" type="submit"><i className="fa fa-save"></i> Save</Button>
                                        <Button variant="danger" type="button" onClick={() => {}}><i className="fa fa-times"></i> Cancel</Button>
                                    </Modal.Footer>
                                </Form>
                            )}
                        </Formik>
                    </Modal>
                </Card.Body>
            </Card>
        )
    }

    export default Seo;