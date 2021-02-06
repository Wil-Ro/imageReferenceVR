import { AvGadget, AvPanel, AvStandardGrabbable, AvTransform, HighlightType, DefaultLanding, GrabbableStyle, renderAardvarkRoot } from '@aardvarkxr/aardvark-react';
import { EAction, EHand, g_builtinModelBox, InitialInterfaceLock, Av } from '@aardvarkxr/aardvark-shared';
import bind from 'bind-decorator';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

class MenuItem extends React.Component< {displayImage, onClick}, {}> //class for items on the menu, basically just a button
{
	constructor(props)
	{
		super(props);
	}

	static defaultProps = {
		displayImage: "https://cdn.pixabay.com/photo/2013/07/12/17/47/test-pattern-152459_960_720.png"
	}

	public render()
	{
		return(
				<button className = "imageMenuButton" onClick = {this.props.onClick}>
					<img src = {this.props.displayImage} className = "imageMenuImage"/>
				</button>
		);
	}
}


class ImageMenu extends React.Component< {}, {}> //class for the whole menu, basically just renders MenuItems according to list of images
{
	imageList:string[];
	imageToDisplay: string;

	constructor(props)
	{
		super(props);
		
		this.imageList = [
			"https://www.pfw.edu/microsites/native-trees/images/trees/g-n/full/kentucky-coffeetree-habit-original-01.jpg", 
			"https://www.pencilkings.com/wp-content/uploads/2013/09/finishedfacedrawingproportionsexamples.jpg", 
			"https://upload.wikimedia.org/wikipedia/commons/0/06/EnglishSpotRabbitChocolate1(cropped).jpg"
		]; //work out how to let the user put images here, use google drive or something?
		this.imageToDisplay = "";
	}

	public displayImage(image: string) //given to buttons, by setting the image to display we stop drawing the menu and start drawing the image, remove image undoes this, we also force an update here since we dont use state
	{
		this.imageToDisplay = image;
		this.forceUpdate();
	}

	public removeImage()
	{
		this.imageToDisplay = null;
		this.forceUpdate();
	}

	public render()
	{
		if (this.imageToDisplay){ //if theres an image then show that, and also a back button
			return(
				<div>
					<button className = "imageDisplayButton" onClick = {() => this.removeImage()}>ᐊ</button>
					<div style = {{textAlign: "center"}}>
						<img className = "displayedImage" src = {this.imageToDisplay}/>	
					</div>
				</div>
			)
		}
		else{ //if there isnt an image selected then show the menu
			if (this.imageList.length > 0){
				let itemList = this.imageList.map((image, step) => { //for each image the user has given us, add it to the menu, we use some maths to calculate their position on the grid then pop it in

					let itemStyle = {
						gridColumnStart: ((step%4)+1).toString(),
						gridRowStart: ((Math.floor(step/4))+1).toString()
					};
					return(
					<div style = {itemStyle}> 
						<MenuItem displayImage = {image} onClick = {() => this.displayImage(image)}/>
					</div> 
					);
				});

				var containerStyle:string = ""; //hopefully will return "15vw 15vw 15vw" with as many 15wvs as nessessary, sets how many rows menu has
				for (var i:number = 0; i < this.imageList.length/4; i++){
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



class MyGadget extends React.Component< {}, {} >
{

	constructor( props: any )
	{
		super( props );
	}

	public openWindow(){
		window.open("https://www.bbc.co.uk/", "bbc")
	}

	

	public render()
	{
		return (
			<div className={ "FullPage" } >
				<div>
					<AvStandardGrabbable modelUri={ "models/HandleModel.glb" } modelScale={ 0.8 }
						style={ GrabbableStyle.Gadget }>
						<AvTransform translateY={ 0.21 } >
							<AvPanel interactive={true} widthInMeters={ 0.3 }/>
						</AvTransform>
					</AvStandardGrabbable>
				</div>
				<ImageMenu/>
				<button id = "uploadButton" onClick = {() => this.openWindow()}>🗅</button>
			</div> );
	}

}

renderAardvarkRoot( "root", <MyGadget/> );
//DONT FORGET TO RUN NPM START AAAAAAAAAAAAAAAAAAAA YOU ALWAYS FORGETTT
/*
todo:
it works!! just clean things up abit, make images fit screen size, make panel size changable maybe?
sliders dont work, maybe use buttons?

useful links:
http://localhost:23842/gadgets/aardvark_monitor/index.html
http://localhost:8042/
*/