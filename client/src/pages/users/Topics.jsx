import { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import Http from "../../services/Http";
import { toast } from "react-toastify";
import { Link, useParams, useNavigate } from "react-router-dom";
import TopicIcon from "../../assets/images/topic_icon.svg";
import "./Topics.css";

const Topics = () => {
    const params = useParams(); 
    const navigate = useNavigate();
    const [module, setModule] = useState({});
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    useEffect(() => {
        document.title = "AnswerSheet - HSC made easy";
        (async () => {
            let { year, subject, module } = params;
            let { data } = await Http.get(`modules/get-module-by-slug`, {
                params: {
                    year_slug: year, 
                    subject_slug: subject,
                    module_slug: module
                }
            });
            if (data.status) {
                setModule(data.data);
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
                        <h1 className="subject-title">{module.name}</h1>
                        { module.description && <p>{module.description}</p>}
                        <div className="topic-list">
                            {
                                module.topics && module.topics.map((topic, idx) => (
                                    <div className="d-grid" key={idx}>
                                        <Link className="btn btn-primary learn-btn" to={`/${params.year}/${params.subject}/${params.module}/${topic.slug}`}>
                                            <img src={TopicIcon} alt="Icon"/> <span>{topic.name}</span>
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

export default Topics;