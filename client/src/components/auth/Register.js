import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { setAlert } from '../../actions/alert';
import { register } from '../../actions/auth';
import PropTypes from 'prop-types';

const Register = ({ setAlert, register, isAuthenticated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });

  const { name, email, password, password2 } = formData;

  // when user enters values on form
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (name === '' || email === '' || password === '') {
      //setAlert
      setAlert('name and password are required fields', 'danger');
    } else if (password !== password2) {
      //setAlert
      setAlert('password doesnt match', 'danger');
    } else {
      register({ name, email, password });
    }
  };

  // redirect if logged in
  if (isAuthenticated) {
    return <Redirect to='/dashboard' />;
  }

  return (
    <Fragment>
      <h1 className='large text-primary'>Join Our Community</h1>
      <p className='lead'>
        <i className='fas fa-user'></i> Register an Account
      </p>
      <form className='form' onSubmit={onSubmit}>
        <div className='form-group'>
          <label htmlFor='name'>Name</label>
          <input
            type='text'
            placeholder='Enter First and Last Name'
            name='name'
            value={name}
            onChange={onChange}
          />
        </div>
        <div className='form-group'>
          <label htmlFor='email'>Email Address</label>
          <input
            type='email'
            placeholder='Email Address'
            name='email'
            value={email}
            onChange={onChange}
          />
          <small className='form-text'>
            This site uses Gravatar so if you want a profile image, use a
            Gravatar email
          </small>
        </div>
        <div className='form-group'>
          <label htmlFor='password'>Password</label>
          <input
            type='password'
            placeholder='Password must be at least 6 characters'
            name='password'
            value={password}
            onChange={onChange}
          />
        </div>
        <div className='form-group'>
          <label htmlFor='password2'>Re-Enter Password</label>
          <input
            type='password'
            placeholder=''
            name='password2'
            value={password2}
            onChange={onChange}
          />
        </div>
        <input type='submit' className='btn btn-primary' value='Register' />
      </form>
      <p className='my-1'>
        Already have an account? <Link to='/login'>Sign In</Link>
      </p>
    </Fragment>
  );
};

Register.propTypes = {
  setAlert: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { setAlert, register })(Register);
