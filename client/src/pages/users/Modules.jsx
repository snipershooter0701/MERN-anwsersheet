import { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import Http from "../../services/Http";
import { toast } from "react-toastify";
import { Link, useParams, useNavigate } from "react-router-dom";
import TopicIcon from "../../assets/images/topic_icon.svg";
import "./Topics.css";

const Modules = () => {
    const params = useParams(); 
    const navigate = useNavigate();
    const [subject, setSubject] = useState({});
    useEffect(() => {
        document.title = "AnswerSheet - HSC made easy";
        (async () => {
            let { year, subject } = params;
            let { data } = await Http.get(`subjects/get-subject-by-slug`, {
                params: {
                    year_slug: year, 
                    subject_slug: subject
                }
            });
            if (data.status) {
                setSubject(data.data);
            } else {
                toast.error(data.msg);
                navigate("/subjects");
            }
        })();
    }, []);
    return (
        <div className="topics-container">
            <Container>
                <Card className="mb-4">
                    <Card.Body className="pt-5 px-5 pb-4">
                        <h2 className="subject-title">{subject.name}</h2>
                        { subject.description && <p>{subject.description}</p>}
                        <div className="topic-list">
                            {
                                subject.modules && subject.modules.map((module, idx) => (
                                    <div className="d-grid" key={idx}>
                                        <Link className="btn btn-primary learn-btn" to={`/${params.year}/${params.subject}/${module.slug}`}>
                                            <img src={TopicIcon} alt="Icon"/> <span>{module.name}</span>
                                        </Link>
                                    </div>
                                ))
                            }
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>        
    )
}

export default Modules;