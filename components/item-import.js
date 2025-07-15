export const importItem = ({item}) => {

//let headers = Object.keys(item)




  return(
    <div>
      <div>
      {Object.keys(item).map((key, index)=> {
          console.log('key', key)
        return(
          <div>
            <div>
              {key}

            </div>
            <div>
            {item[key]}
            </div>
        </div>
        )

      })}
    </div>
    <div>

    </div>
    </div>
  )
}
