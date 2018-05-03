
var camera, scene, renderer, controls;

var objects = [];

var raycaster;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This section just checks if the libraries and APIs are compatible with the user's browser

var container = document.getElementById("container");
var content = document.getElementById("content");

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock)
{
	var element = document.body;
	
	var pointerlockchange = function ( event ) 
	{

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) 
		{

            controlsEnabled = true;
            controls.enabled = true;
            container.style.display = 'none';
        } 
		
		else 
		{
            controls.enabled = false;
            container.style.display = 'block';
            content.style.display = '';
        }

    };
	
	var pointerlockerror = function (event) 
	{
        content.style.display = '';
    };

	 document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	 document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	 document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

	content.addEventListener( 'click', function ( event ) 
	{
		content.style.display = 'none';

		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();

	}, false );

} 

else 
{
    content.innerHTML = "Your browser does not support the PointerLock API";
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

init(); // this is the function where we initialize all shapes, lights, directions, and the camera
animate(); // this is the function where we animate motion

// controls 
var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();

// for the speed of the motion
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();

function init()
{
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000 ); // create a camera
	
	// Create a scene with a white background
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
	
	// Connect camera to first person view
	controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());
	
	 // If the user presses the key, move in the specified direction
    var onKeyDown = function ( event ) 
	{
		if (event.keyCode == 38 || event.keyCode == 87)
		{
			moveForward = true;
		}
		
		if (event.keyCode == 37 || event.keyCode == 65)
		{
			moveLeft = true;
		}
			
		if (event.keyCode == 40 || event.keyCode == 83)
		{
			moveBackward = true;
		} 

		if (event.keyCode == 39 || event.keyCode == 68)
		{
			moveRight = true;
		}

		if (event.keyCode == 32)
		{
			if ( canJump === true ) 
				velocity.y += 350;
			canJump = false;
		}                
    };

    // If the user lets go of the key, stop moving
    var onKeyUp = function ( event ) 
	{
        if (event.keyCode == 38 || event.keyCode == 87)
		{
			moveForward = false;
		}
		
		if (event.keyCode == 37 || event.keyCode == 65)
		{
			moveLeft = false;
		}
			
		if (event.keyCode == 40 || event.keyCode == 83)
		{
			moveBackward = false;
		} 

		if (event.keyCode == 39 || event.keyCode == 68)
		{
			moveRight = false;
		}
    };
	
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
	
	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 20);
	
	
	/* Add a floor to the scene -- for reference 
	
	var loaderFloor = new THREE.DDSLoader();
    var map1 = loaderFloor.load('images/disturb_dxt1_nomip.dds' );
    map1.minFilter = map1.magFilter = THREE.LinearFilter;
    map1.anisotropy = 4;

    var cubemap1 = loaderFloor.load('images/Mountains.dds', function ( texture ) {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.mapping = THREE.CubeReflectionMapping;
        material1.needsUpdate = true;
    } );
	
	
	var material1 = new THREE.MeshPhongMaterial( { map: map1, envMap: cubemap1 , dithering: true} );

	var floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    floorGeometry.rotateX( - Math.PI / 2);

    var loaderFloorTexture = new THREE.TextureLoader(),
        floorTexture = loaderFloorTexture.load("images/soil.jpg");

    var floorMaterial = new THREE.MeshLambertMaterial( { map: floorTexture, dithering: true });

    var floor = new THREE.Mesh( floorGeometry, material1 );
    floor.receiveShadow = true;
    scene.add( floor );
	
	*/
	
	
	// Add a light to the scene
	
	var light= new THREE.SpotLight( 0xffffff);
    light.position.set(100, 100, 0 );

    light.angle = Math.PI;
    light.penumbra = 0.05;
    light.decay = 2;

    light.castShadow = true;

    light.shadow.mapSize.width = 1000;
    light.shadow.mapSize.height = 4000;

    light.shadow.camera.near = 10;
    light.shadow.camera.far = 4000;
    light.shadow.camera.fov = 90;

    scene.add(light);
	
	// Add a renderer to ensure that the graphics display properly 
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );
}

function animate()
{
	requestAnimationFrame(animate);

	// Set movement speed 
    if (controlsEnabled === true) 
	{
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects(objects);

        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta;

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveLeft ) - Number( moveRight );
        direction.normalize();

        if ( moveForward || moveBackward ) 
			velocity.z -= direction.z * 500.0 * delta;
		
        if ( moveLeft || moveRight ) 
			velocity.x -= direction.x * 500.0 * delta;

        if ( onObject === true ) 
		{
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        }

        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < 10 ) 
		{
            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;
        }

        prevTime = time;

    }

    renderer.render(scene, camera);

}