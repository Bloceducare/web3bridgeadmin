import React from 'react'

type pageProps = {
  pageTitle: string;
}
const  PageNav:React.FC<pageProps> = ({pageTitle}) => {
  return (
    <div>{pageTitle}</div>
  )
}

export default PageNav