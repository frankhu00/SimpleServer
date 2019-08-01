import React from 'react'
import styled from 'styled-components'

const Home = styled.div`
    width: 100%;
    height: 100%;
`

export default (props) => {
    return (
        <Home {...props}>
            Hello World!
        </Home>
    )
}