import { AvGadget, AvPanel, AvStandardGrabbable, AvTransform, HighlightType, DefaultLanding, GrabbableStyle, renderAardvarkRoot } from '@aardvarkxr/aardvark-react';
import { EAction, EHand, g_builtinModelBox, InitialInterfaceLock, Av } from '@aardvarkxr/aardvark-shared';
import bind from 'bind-decorator';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ImageAdder } from './imageadder';
import * as IPFS from 'ipfs';

class MenuItem extends React.Component< {displayImage, onClick, deleteSelfCallback}, {}> //class for items on the menu, basically just a button
{
	constructor(props)
	{
		super(props);
	}

	public render()
	{
		return(
			<div className = "imageMenuButtonContainer">
				<button className = "imageMenuButton" onClick = {this.props.onClick}>
					<img src = {this.props.displayImage} className = "imageMenuImage"/>
				</button>
				{ !AvGadget.instance().isRemote && 
					<button className = "imageMenuDeleteButton" onClick = {this.props.deleteSelfCallback}>X</button> }
			</div>
		);
	}
}

interface ImageMenuEntry
{
	localUrl: string;
	remoteUrl: string;
}

enum ImageMenuEventType
{
	SetImage = "set_image",
}

interface ImageMenuEvent
{
	type: ImageMenuEventType;
	url: string;
}

interface ImageMenuState
{
	imageUrls: ImageMenuEntry[];	
}

interface ImageMenuProps
{
	sendEventCallback: ( event: ImageMenuEvent ) => void;
}

class ImageMenu extends React.Component< ImageMenuProps, ImageMenuState> //class for the whole menu, basically just renders MenuItems according to list of images
{
	imageToDisplay: ImageMenuEntry = null;

	constructor(props)
	{
		super(props);

		this.state =
		{
			imageUrls: [],
		}
	}

	@bind
	public onAddImage( localUrl: string, remoteUrl: string )
	{
		this.setState( 
			{
				imageUrls:
				[ 
					...this.state.imageUrls, 
					{
						localUrl,
						remoteUrl,
					}
				]
			}
		);
	}

	@bind
	public validateUrl( localUrl: string )
	{
		return localUrl && this.findImageIndex( localUrl ) == -1;
	}


	private findImageIndex( localUrl: string )
	{
		return this.state.imageUrls.findIndex( ( value: ImageMenuEntry ) => value.localUrl == localUrl );
	}

	public displayImage( image: ImageMenuEntry ) //given to buttons, by setting the image to display we stop drawing the menu and start drawing the image, remove image undoes this, we also force an update here since we dont use state
	{
		this.imageToDisplay = image;
		this.forceUpdate();

		this.props.sendEventCallback(
			{
				type: ImageMenuEventType.SetImage,
				url: image.remoteUrl,
			}
		);
	}

	public removeImage()
	{
		this.imageToDisplay = null;
		this.forceUpdate();
	}

	public deleteListItem(localUrl: string)
	{
		let i = this.findImageIndex( localUrl );
		if( i != -1 )
		{
			this.state.imageUrls.splice( i, 1);
			this.forceUpdate();
		}
	}

	public render()
	{
		if (this.imageToDisplay){ //if theres an image then show that, and also a back button
			const url = AvGadget.instance().isRemote ? this.imageToDisplay.remoteUrl : this.imageToDisplay.localUrl;

			return(
				<div>
					<button className = "imageDisplayBackButton" onClick = {() => this.removeImage()}>ᐊ</button>
					<div className = "displayedImageContainer">
						<img className = "displayedImage" src = { url }/>	
					</div>
				</div>
			)
		}
		else{ //if there isnt an image selected then show the menu
			if (this.state.imageUrls.length > 0){
				let itemList = this.state.imageUrls.map((image, step) => { //for each image the user has given us, add it to the menu, we use some maths to calculate their position on the grid then pop it in

					let itemStyle = {
						gridColumnStart: ((step%4)+1).toString(),
						gridRowStart: ((Math.floor(step/4))+1).toString()
					};
					return(
					<div style = {itemStyle}> 
						<MenuItem displayImage = {image.localUrl} onClick = {() => this.displayImage(image)} deleteSelfCallback = {() => this.deleteListItem( image.localUrl )}/>
					</div> 
					);
				});

				var containerStyle:string = ""; //hopefully will return "15vw 15vw 15vw" with as many 15wvs as nessessary, sets how many rows menu has
				for (var i:number = 0; i < this.state.imageUrls.length/4; i++){
					containerStyle += "20vw ";
				}

				return(
					<div className = "imageMenuContainer" style = {{gridTemplateRows: containerStyle}}>
						{itemList}
					</div>
				);
			}
			else{
				return(
				<div id = "noImageText">
					There are no images here, add some to start!
				</div>
				);
			}
		}
		
	}
}


const k_popupHtml = 
`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>referenceImageVR popup</title>
	<link href="styles.css" rel="stylesheet">
  </head>

  <body>
    <div id="root" class="FullPage"></div>
  </body>
</html>
`;

interface MyGadgetState
{
	remoteUrl: string;
}

interface MyGadgetRemoteParams
{
	remoteUrl: string;
}

const k_ImageGalleryInterface = "image-gallery@1";

class MyGadget extends React.Component< {}, MyGadgetState >
{
	private addImagePopup: Window = null;
	private imageMenuRef = React.createRef<ImageMenu>();
	private grabbableRef = React.createRef<AvStandardGrabbable>();

	constructor( props: any )
	{
		super( props );

		this.state = 
		{
			remoteUrl: null,
		}
	}

	public openWindow(){
		this.addImagePopup = window.open("", "popup", "", true );
		this.addImagePopup.document.write( k_popupHtml );

		ReactDOM.render( <ImageAdder addImageCallback={ this.imageMenuRef?.current.onAddImage } validateUrlCallback={this.imageMenuRef.current.validateUrl}/>, 
			this.addImagePopup.document.getElementById( "root" ) );
	}

	@bind
	private onRemoteEvent( event: ImageMenuEvent )
	{
		switch( event.type )
		{
			case ImageMenuEventType.SetImage:
				{
					this.setState( { remoteUrl: event.url } );
				}
				break;
		}
	}

	@bind
	private sendRemoteEvent( event: ImageMenuEvent )
	{
		if( event.type == ImageMenuEventType.SetImage )
		{
			this.setState( { remoteUrl: event.url } );
		}
		this.grabbableRef.current?.sendRemoteEvent( event, true );
	}

	public componentDidMount()
	{
		if( AvGadget.instance().isRemote )
		{
			let params = AvGadget.instance().findInitialInterface( k_ImageGalleryInterface )?.params as MyGadgetRemoteParams;
			if( params?.remoteUrl )
			{
				this.setState( { remoteUrl: params.remoteUrl } );
			}
		}
	}

	private renderLocal()
	{
		let remoteInitLocks: InitialInterfaceLock[] = [];

		if( this.state.remoteUrl )
		{
			remoteInitLocks.push( {
				iface: k_ImageGalleryInterface,
				receiver: null,
				params: 
				{
					remoteUrl: this.state.remoteUrl,
				}
			} );
		}

		return (
			<div className={ "FullPage" } >
				<div>
					<AvStandardGrabbable modelUri={ "models/HandleModel.glb" } 
						modelScale={ 0.8 }
						style={ GrabbableStyle.Gadget }
						remoteInterfaceLocks={ remoteInitLocks }
						ref={ this.grabbableRef }
						>
						<AvTransform translateY={ 0.21 } >
							<AvPanel interactive={true} widthInMeters={ 0.3 }/>
						</AvTransform>
					</AvStandardGrabbable>
				</div>
				<ImageMenu ref={ this.imageMenuRef }
					sendEventCallback={ this.sendRemoteEvent }/>
				<button id = "uploadButton" onClick = { () => this.openWindow() }>🗅</button>
			</div> );
	}

	private renderRemoteImage()
	{
		if (this.state.remoteUrl)
		{
			//if theres an image then show that
			return(
				<div>
					<div style = {{textAlign: "center"}}>
						<img className = "displayedImage" src = { this.state.remoteUrl  }/>	
					</div>
				</div>
			)
		}
		else
		{
			return(
			<div id = "noImageText">
				The owner hasn't selected an image.
			</div>
			);
		}
	}

	private renderRemote()
	{
		
		return (
			<div className={ "FullPage" } >
				<div>
					<AvStandardGrabbable modelUri={ "models/HandleModel.glb" } 
						modelScale={ 0.8 }
						style={ GrabbableStyle.Gadget }
						remoteInterfaceLocks={ [] }
						remoteGadgetCallback={ this.onRemoteEvent }
						ref={ this.grabbableRef }
						>
						<AvTransform translateY={ 0.21 } >
							<AvPanel interactive={true} widthInMeters={ 0.3 }/>
						</AvTransform>
					</AvStandardGrabbable>
					{ this.renderRemoteImage() }
				</div>
			</div> );

	}

	public render()
	{
		if( AvGadget.instance().isRemote )
		{
			return this.renderRemote();
		}
		else
		{
			return this.renderLocal();
		}
	}

}

renderAardvarkRoot( "root", <MyGadget/> );
//DONT FORGET TO RUN NPM START AAAAAAAAAAAAAAAAAAAA YOU ALWAYS FORGETTT
/*
todo:
look into using avmodel to create pop-up images
Ipfs node dies when image adder is closed and it doesnt come back when re-opened, fix that at somepoint


useful links:
http://localhost:23842/gadgets/aardvark_monitor/index.html
http://localhost:8042/
*/