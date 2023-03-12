import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { useNavigate  } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { deleteUser } from "../../store/reducers/userReducer";
import {
  cilLockLocked,
  cilUser,
  cilSquare
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import avatar from '../../assets/images/avatar.png'
import { toast } from 'react-toastify';

const AppHeaderDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const logout =  () => {
    dispatch(deleteUser());
    toast.success("Logged out successfully.");
    navigate("/login");
  }
  const user = useSelector(state => state.user)
  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0" caret={false}>
        <CAvatar src={avatar} size="md" />
        <span className="ms-1">{user.user.firstName}</span>
      </CDropdownToggle>
      <CDropdownMenu placement="bottom-end">
        <CDropdownItem onClick={() => navigate("/")} style={{cursor: 'pointer'}}>
          Main site
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate("/profile")} style={{cursor: 'pointer'}}>
        {/* <CDropdownItem onClick={() => navigate("/admin/profile")}> */}
          Profile
        </CDropdownItem>
        <CDropdownItem onClick={() => logout()} style={{cursor: 'pointer'}}>
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
