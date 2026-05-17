'use client'
import { useState, useEffect, useRef, memo, useMemo } from "react";
import { getChannels } from "@/lib/supabase";
import Checkbox from '@mui/material/Checkbox';
import {
  Facebook,
  Instagram,
  ChevronDown,
  X
} from 'lucide-react';

export const ChannelSelector = ({
  userId,
  postInfo,
  setSocialPagesParent,
  callback
}) => {
  const [open, setOpen] = useState(false)
  const [socialPages, setSocialPages] = useState([])
  const [selectedChannelIds, setSelectedChannelIds] = useState([])
  const [selectedSocialPages, setSelectedSocialPages] = useState([])
  const [pageFilter, setPageFilter] = useState('')


  useEffect(() => {
    if (!userId) return

    const loadInfo = async () => {

      //const facebookPages = await getFacebookPages(userId)
      //const instagramPages = await getInstagramPages(userId)

      const channels = await getChannels(userId)

      if (setSocialPagesParent){
          setSocialPagesParent(channels)
      }



      const facebookPages = channels.filter((channel)=> channel.platform === 'facebook')
      const instagramPages = channels.filter((channel)=> channel.platform === 'instagram')
      const onesignalPages = channels.filter((channel)=> channel.platform === 'One Signal')


      if (!facebookPages || !instagramPages) return

      const newPages = facebookPages.map(facebookPage => {

        const instagramPage = instagramPages.find(
          insta => insta.metadata?.facebook_page_id === facebookPage.metadata?.facebook_page_id
        )

        const oneSignalPage = onesignalPages.find(
          onesignal => onesignal.metadata?.facebook_page_id === facebookPage.metadata?.facebook_page_id
        )

        if (instagramPage && oneSignalPage){
          return { facebook: facebookPage, instagram: instagramPage,  oneSignal: oneSignalPage}
        } if (instagramPage && !oneSignalPage) {
          return { facebook: facebookPage, instagram: instagramPage }
        }else{
          return { facebook: facebookPage }
        }

      })


      setSocialPages(newPages)
      //postInfo?.data?.facebook_page_id

      // ✅ Preselect safely
      if (postInfo?._def?.extendedProps?.platform_account) {
        const preSelectedIds = [
          ...facebookPages
          .filter(p => p.external_account_id === postInfo?._def?.extendedProps?.platform_account.external_account_id)
              .map(p => p.id),

          ...instagramPages
          .filter(p => p.external_account_id === postInfo?._def?.extendedProps?.platform_account.external_account_id)
            .map(p => p.id),

          ...onesignalPages
          .filter(p => p.external_account_id === postInfo?._def?.extendedProps?.platform_account.external_account_id)
            .map(p => p.id)
        ]

        setSelectedChannelIds(preSelectedIds)
      }
    }

    loadInfo()
  }, [userId, postInfo])

  const selectSocial = (id) => {
    setSelectedChannelIds(prev =>
      prev.includes(id)
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    )
  }

  const allPages = useMemo(() => {
    return socialPages.flatMap(page => {
      return [page.facebook, page.instagram, page.oneSignal].filter(Boolean)
    })
  }, [socialPages])



useEffect(()=>{
    const selectedPages = allPages.filter((page)=> selectedChannelIds.includes(page.id))
    setSelectedSocialPages(selectedPages)
    callback(selectedPages)
},[selectedChannelIds])

const sortedSocialPages = useMemo(() => {
  const selected = []
  const unselected = []

  socialPages.forEach(page => {

    const isSelected =
      (page.facebook && selectedChannelIds.includes(page.facebook.id)) ||
      (page.instagram && selectedChannelIds.includes(page.instagram.id)) ||
      (page.oneSignal && selectedChannelIds.includes(page.oneSignal.id))

    if (isSelected) {
      selected.push(page)
    } else {
      unselected.push(page)
    }
  })

  return [...selected, ...unselected]
}, [socialPages, selectedChannelIds])



return(
  <>
    {open &&
      <div
        onClick={() => setOpen(prev => !prev)}
        style={{
        position:'fixed',
        height:'100%',
        width:'100%',
        left: '0px',
        top: '0px',
      }}/>
    }
    <div style={{position:'relative'}}>
      <button style={{
        width:'100%',
        paddingLeft: '10px',
        marginTop:'0px'
      }} onClick={() => setOpen(prev => !prev)} className='btn primary icon-button'>
        {selectedSocialPages.length<1?
          <>
              Choose a Channel...
          </>
          :
          <div style={{display:'flex', flexDirection:'column'}}>
            {selectedSocialPages.map((page, index)=>{

                return(
                  <div key={index}
                    style={{
                      padding: '5px 10px 5px 5px',
                      background: 'var(--md-sys-color-primary-container)',
                      borderRadius: '7px',
                      marginBottom: `${index === (selectedSocialPages.length-1)? '0px':'10px'}`
                    }}>
                      {page.platform === 'facebook' &&
                        <div style={{display:'flex', gap:'5px', alignItems: 'center'}}>
                          <Facebook style={{width:'20px', height:'20px'}}/>
                          {page.name}
                          <X onClick={()=>selectSocial(page.id)}/>
                        </div>
                      }
                      {page.platform === 'instagram' &&
                        <div style={{display:'flex', gap:'5px', alignItems: 'center'}}>
                          <Instagram style={{width:'20px', height:'20px'}}/>
                          {page.name}
                          <X onClick={()=>selectSocial(page.id)}/>
                        </div>
                      }
                      {page.platform === 'One Signal' &&
                        <div style={{display:'flex', gap:'5px', alignItems: 'center'}}>
                          <Instagram style={{width:'20px', height:'20px'}}/>
                          {page.name}
                          <X onClick={()=>selectSocial(page.id)}/>
                        </div>
                      }


                  </div>
                )
              })
            }
          </div>
        }
        <ChevronDown style={{marginLeft: 'auto'}} className='button-icon'/>
      </button>
      {open &&
        <div style={{
          position:'absolute',
          height:'300px',
          overflowY:'scroll',
          paddingTop:0,
          paddingBottom:0,
          width: '100%',
          minWidth: '315px'
        }} className='canvas-zoom-dropdown dropshadow'>
          <input
            id="pageFilter"
            type="text"
            className={'form-input'}
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
          />
          {sortedSocialPages
            .filter((social)=>{
              return social?.facebook?.name.toLowerCase().includes(pageFilter.toLowerCase()) ||
                social?.instagram?.name.toLowerCase().includes(pageFilter.toLowerCase()) ||
                social?.oneSignal?.name.toLowerCase().includes(pageFilter.toLowerCase())


              }
            )
            .map((social, index)=> {
            return(
              <div key={index}>
                  <div style={{margin:'10px 0px'}} className="properties-container">
                    {social.facebook &&
                      <label style={{ marginRight: '1em', display: 'flex', alignItems: 'center', marginBottom:'5px'}}>
                        <SelectCheckBox
                          style={{marginRight:'10px'}}
                          className="form-check-input"
                          type="checkbox"
                          callBackFunction={selectSocial}
                          id={social.facebook.id}
                          checked={selectedChannelIds.includes(social.facebook.id)}
                      />
                        <div style={{display:'flex', gap:'5px', alignItems: 'center'}}>
                          <Facebook style={{width:'20px', height:'20px'}}/>
                          {social.facebook.name}
                        </div>
                      </label>
                    }
                    {social.instagram &&
                      <label style={{ marginRight: '1em', display: 'flex', alignItems: 'center',  marginBottom:'5px'}}>
                        <SelectCheckBox
                          style={{marginRight:'10px'}}
                          className="form-check-input"
                          type="checkbox"
                          callBackFunction={selectSocial}
                          id={social.instagram.id}
                          checked={selectedChannelIds.includes(social.instagram.id)}
                        />
                        <div style={{display:'flex', gap:'5px', alignItems: 'center'}}>
                          <Instagram style={{width:'20px', height:'20px'}}/>
                          {social.instagram.name}
                        </div>
                      </label>
                    }
                    {social.oneSignal &&
                      <label style={{ marginRight: '1em', display: 'flex', alignItems: 'center'}}>
                        <SelectCheckBox
                          style={{marginRight:'10px'}}
                          className="form-check-input"
                          type="checkbox"
                          callBackFunction={selectSocial}
                          id={social.oneSignal.id}
                          checked={selectedChannelIds.includes(social.oneSignal.id)}
                        />
                        <div style={{display:'flex', gap:'5px', alignItems: 'center'}}>
                          <img src='/one-signal-icon.svg' style={{width:'20px', height:'20px'}}/>
                          {social.oneSignal.name}
                        </div>
                      </label>
                    }
                  </div>
              </div>
            )
            })
          }
      </div>
    }
    </div>
  </>
)

}

const SelectCheckBox = ({ style, id, callBackFunction, checked }) => {
  return (
    <Checkbox
      style={style}
      id={id}
      className="form-check-input"
      type="checkbox"
      onChange={() => callBackFunction(id)}
      checked={checked}
      sx={{
        color: 'var(--md-sys-color-secondary)',
        '&.Mui-checked': {
          color: 'var(--md-sys-color-primary)',
        },
      }}
    />
  )
}
