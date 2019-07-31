import ReactDOM from 'react-dom'
import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

import Home from './Home'

ReactDOM.render(
    <BrowserRouter>
        <Switch>
            <Route path='/' component={Home} />
        </Switch>
    </BrowserRouter>
, document.getElementById('root'));