import React, { Component } from 'react'
import PreviewPane from './PreviewPane'
import SliderPane from './SliderPane'
import FilterPane from './FilterPane'
import InfoPane from './InfoPane'
import ViewPane from './ViewPane'
import MappingsPane from './MappingsPane'
import Export from './Export'
import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import './scss/Menu.scss';
import Projection from './Projection'
import * as _ from 'lodash'
import { CircularProgress } from "@material-ui/core";
import { FaDatabase, FaSlidersH, FaSearch, FaCloudDownloadAlt, FaAngleDoubleLeft, FaAngleDoubleRight, FaRegImage, FaInfo, FaQuestion, FaEye } from "react-icons/fa";

class Layout extends Component {
  constructor(props) {
    super(props)
    let total = this.props.settings["total"]
    this.state = {
      ww: null,
      wh: null,
      hover_index: 0,
      previewPane_height: null,
      controlPane_height: null,
      filterPane_height: null,
      algorithm_choice: null,
      allFilter: {},
      currentProjection: new Float32Array(total).fill(0),
      currentFilter: new Float32Array(total).fill(0),
      currentSearch: new Float32Array(total).fill(0),
      scaleMin: 14,
      scaleMax: 70,
      filterGrey: true,
      clusterTypeSelected:'-',
      greyRenderTypeSelected:0,
      dimensions: {},
      language: 'english',
      collapsedControl: false,
      collapsedObject: false
    }
    this.previewPane_ctx = null;
    this.setSize = _.debounce(this.setSize.bind(this), 200);
    this.setPreviewPaneCanvas = this.setPreviewPaneCanvas.bind(this);
    this.setPreviewImage = this.setPreviewImage.bind(this);
    this.selectAlgorithm = this.selectAlgorithm.bind(this);
    this.selectDataset = this.selectDataset.bind(this);
    this.toggleControl = this.toggleControl.bind(this);
    this.refProjection = React.createRef();
    this.english = "The Collection Space Navigator (CSN) is an exploratory visualisation tool for exploring collections and their multidimensional representations. The tool was developed to better understand multidimensional data, their methods and semantic qualities through spatial navigation and filtering. CSN is used here with parts of the digital collections of the Badisches Landesmuseum Karlsruhe and Allard Pierson Amsterdam. It enables individual areas of the collection to be better explored and displayed and is thus a starting point for further collection research, as well as being beautiful. The tool was developed by Tillmann Ohm and Mar Canet Solà and adapted within the framework of 'Creative User Empowerment'(2023) by Tillmann Ohm, Etienne Posthumus, Sonja Thiel.";
    this.deutsch = "Der Collection Space Navigator (CSN) ist ein exploratives Visualisierungstool für die Erforschung von Sammlungen und ihren multidimensionalen Darstellungen. Das Tool wurde entwickelt, um multidimensionale Daten, ihre Methoden und semantischen Qualitäten durch räumliche Navigation und Filterung besser zu verstehen. CSN wird hier mit Teilen der digitalen Sammlungen des Badischen Landesmuseums Karlsruhe und Allard Pierson Amsterdam eingesetzt. Es ermöglicht, einzelne Sammlungsbereiche besser erforschbar und darstellbar zu machen und ist somit ein Ausgangspunkt für weitere Sammlungsforschung und außerdem wunderschön. Das Tool wurde entwickelt von Tillmann Ohm und Mar Canet Solà und im Rahmen von `Creative User Empowerment`(2023) angepasst durch Tillmann Ohm, Etienne Posthumus, Sonja Thiel.";
  }
  

  toggleLanguage = () => {
    const newLanguage = this.state.language === 'english' ? 'german' : 'english';
    this.setState({ language: newLanguage });
  }

  componentDidMount() {
    this.setDefaults();
    this.selectAlgorithm(this.props.algorithm_name);
    this.setSize();
    window.addEventListener('resize', this.setSize);
  }

  setDefaults(){
    if (this.props.settings["total"] < 20000) {
      this.setState( { scaleMin: 15, filterGrey: true, greyRenderTypeSelected: 0 } )
    } else {
      this.setState( { scaleMin: 5, filterGrey: false, greyRenderTypeSelected: 1 } )
    }
  }

  setRenderer(renderer){
    this.setState( { renderer: renderer});
  }

  handleChangeScale(e,val) {
    this.setState({ scaleMin: val})
  }

  handleChangeZoom(e,val) {
    this.setState({ scaleMax: val})
  }

  handleChangeCluster(e) {
    let value = e.target.value;
    this.setState({ clusterTypeSelected: parseInt(value)})
    console.log(e.target)
    try{
      this.refProjection.current.updateClusterColors(value)
    } catch(error) {console.log("error updateClusterColors")}
  }

  handleChangeGrey(value) {
    this.setState({ greyRenderTypeSelected: value})
  }

  calculateProjection=(newArr,type, update)=>{
    let A, B, arr;
    if(type==="filter"){
      this.setState({currentFilter: newArr})
      A = newArr;
      B = this.state.currentSearch;
    }
    if(type==="search"){
      this.setState({currentSearch: newArr});
      A = this.state.currentFilter;
      B = newArr;
    }
    if(update){
      arr = A.map((x, idx) => x + B[idx]);
      this.setState({currentProjection: arr});
    } else {
      arr = newArr;
    }
    try{
      this.refProjection.current.updateProjection(arr);
    } catch(error) {}
    }

  selectAlgorithm(v) {
    let i = this.props.algorithm_options.indexOf(v);
    if(i<0) i = 0;
    this.setState({ algorithm_choice: i });
    // Save algorithm in URL parameters
    this.props.addToUrl('projection',this.props.algorithm_options[i]);
  }

  selectDataset(p) {
    this.props.changeDataset(p);
  }

  setSize() {
    this.setState({ ww: window.innerWidth, wh: window.innerHeight });
    let previewPane_height = this.previewPane_mount.offsetHeight;
    this.setState({ previewPane_height: previewPane_height });
    if (this.previewPane_ctx) this.previewPane_ctx.imageSmoothingEnabled = false;
    if ( window.innerWidth < 900) {
      this.setState({ collapsedControl: true, collapsedObject: true })
    } else {
      this.setState({ collapsedControl: false, collapsedObject: false })

    }
  }

  setPreviewPaneCanvas(canvas) {
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.previewPane_ctx = ctx;
    console.log(ctx);
  }

  setPreviewImage() {
      return (
      <img
      src={this.props.settings.image_prefix + this.props.metadata[this.state.hover_index].URL}
      alt="preview"
      style={{
        verticalAlign: "middle",
      }}
      />)
  }


  setHoverIndex(hover_index) {
    if (hover_index){
      this.setState({ hover_index: hover_index });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  clickOnImage(){
    try{
      let url = this.props.settings["url_prefix"] + this.props.metadata[this.state.hover_index].id;
      // console.log(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }catch(err){}
  }

  toggleControl = () => {
    this.setState({ collapsedControl: !this.state.collapsedControl 
  })}
  
  toggleObject = () => {
    this.setState({ collapsedObject: !this.state.collapsedObject 
  })}


  render() {
    let {
      embeddings_data,
      mappings,
      algorithm_options,
      dataset_options,
      metadata,
      settings,
      barData
    } = this.props;

    let {
      ww,
      wh,
      hover_index,
      algorithm_choice,
      currentProjection,
      allFilter,
      greyRenderTypeSelected,
      clusterTypeSelected,
      collapsedControl,
      collapsedObject
    } = this.state;

    let previewPane_ctx = this.previewPane_ctx;
    
    let line_height = 1.5;

    let previewPane_style = {
      position: 'absolute',
      left: 0,
      top: 0,
      // width: 320,
      height: 'auto',
      maxHeight: '100vh',
      overflow: 'auto',
      background: '#222',
      zIndex: 8
    };
    let controlMenu_style = {
      position: 'absolute',
      right: 0,
      top: 0,
      // width: 300,
      // left:ww-350,
      height: 'auto',
      maxHeight: '100vh',
      overflow: 'auto',
      background: '#222',
      zIndex: 8
    };

    let main_style = {
      position: 'relative',
      background: '#adadad',
      overflow: 'hidden',
      width: ww, 
      height: wh
    };

    let previewPane_image_size = '320px';
    let font_size = 16;

    let grem = font_size * line_height;

    let general_style = {
      fontSize: font_size,
      lineHeight: line_height,
    };

    let displayNumb = 0;
    for(let i=0;i<settings.total;i++){
      if(currentProjection[i]===0){
        displayNumb++;
      }
    }


    return ww !== null ? (
      <div style={general_style}>
        <div
          style={controlMenu_style}
          ref={controlMenu_mount => {
            this.controlMenu_mount = controlMenu_mount
          }}
        >
          <div>
          <ProSidebar collapsed={collapsedControl}>
            <Menu iconShape='square'>
            <MenuItem>
            {collapsedObject ? (
              <h3></h3>
            ) : (
          <div>
            <div style={{textAlign: 'right'}}>
              <img className='ap_logo' src="ap_logo.svg" width="160px" alt="Allard Pierson Logo" />
            </div>  
          </div>
            )}            
            <a className="collapseCon" onClick={this.toggleControl}>{collapsedControl ? < FaAngleDoubleLeft />  : < FaAngleDoubleRight /> }</a>
            </MenuItem>

  

              <SubMenu defaultOpen
              title={collapsedControl ? null : "Collection"}  
              icon={collapsedControl ? < FaDatabase />  : null }
              >
              <MenuItem>
              <MappingsPane
                grem={grem}
                algorithm_options={algorithm_options}
                algorithm_choice={algorithm_choice}
                selectAlgorithm={this.selectAlgorithm}
                dataset_options={dataset_options}
                selectDataset={this.selectDataset}
                selectedDataset={this.props.selectedDataset}
                datasetInfo={settings["datasetInfo"]}
              />
              </MenuItem>
              </SubMenu>
              <SubMenu defaultOpen
              title={collapsedControl ? null : "Time Filter"}  
              icon={collapsedControl ? <FaSlidersH />  : null }
              >

                <MenuItem>
                <SliderPane
                grem={grem}
                metadata={metadata}
                hover_index={hover_index}
                settings={settings}
                barData={barData}
                calculateProjection={this.calculateProjection}
                currentProjection={currentProjection}
                allFilter={allFilter}
                />
                </MenuItem>
                </SubMenu>

                <SubMenu defaultOpen
                title={collapsedControl ? null : "Query Filter"}  
                icon={collapsedControl ? < FaSearch />  : null }
                >

                <MenuItem>
                  <FilterPane
                    grem={grem}
                    calculateProjection={this.calculateProjection}
                    hover_index={hover_index}
                    settings={settings}
                    metadata={metadata}
                    currentProjection={currentProjection}
                    allFilter={allFilter}
                  />
                </MenuItem>
              </SubMenu>
              <SubMenu
                title={collapsedControl ? null : "Export Filtered Data"}  
                icon={collapsedControl ? <FaCloudDownloadAlt />  : null }
                >

              <MenuItem>
                <Export
                metadata = {metadata}
                currentProjection = {currentProjection}
                />
              </MenuItem>
            </SubMenu>
            </Menu>
          </ProSidebar>
          </div>
        </div>    

        <div
          style={previewPane_style}
          ref={previewPane_mount => {
            this.previewPane_mount = previewPane_mount
          }}
        >

        <div>
          <ProSidebar collapsed={collapsedObject}>
            <Menu iconShape='square'>   
            <MenuItem>
            {collapsedObject ? (
              <h3></h3>
            ) : (
          <div>
            <div style={{marginLeft: '4px'}}>
              <img className='blm_logo' src="blm_logo.svg" width="160px" alt="Badisches Landesmuseum Logo" />
            </div>
          </div>
            )}            
            <a className='collapseObj' onClick={this.toggleObject}>{collapsedObject ? < FaAngleDoubleRight />  : < FaAngleDoubleLeft /> }</a>
            </MenuItem>
              <SubMenu defaultOpen
                title={collapsedObject ? null : "Object Preview"}  
                icon={collapsedObject ? <FaRegImage />  : null }
                >  
                <PreviewPane
                  previewPane_image_size={previewPane_image_size}
                  setPreviewPaneCanvas={this.setPreviewPaneCanvas}
                  setPreviewImage={this.setPreviewImage}
                  hover_index={hover_index}
                  image_server={settings.image_server}
                />
              </SubMenu>
              <SubMenu defaultOpen
                title={collapsedObject ? null : "Object Info"}  
                icon={collapsedObject ? <FaInfo />  : null }
                >  
                <MenuItem>
                <InfoPane
                  hover_index={hover_index}
                  metadata={metadata}
                  infos={settings.info}
                />
                </MenuItem>
              </SubMenu>

              <SubMenu
                title={collapsedObject ? null : "Object Appearance"}  
                icon={collapsedObject ? <FaEye />  : null }
                > 
                <MenuItem>
                <ViewPane
                  clusters={settings.clusters}
                  scaleMin={this.state.scaleMin}
                  scaleMax={this.state.scaleMax}
                  filterGrey={this.state.filterGrey}
                  handleChangeScale = {this.handleChangeScale.bind(this)}
                  handleChangeZoom = {this.handleChangeZoom.bind(this)}
                  handleChangeCluster = {this.handleChangeCluster.bind(this)}
                  handleChangeGrey = {this.handleChangeGrey.bind(this)}
                  total = {settings.total}
                />
                </MenuItem>
                <MenuItem>
                <div className='info'>showing {displayNumb} / {settings.total}</div>
              </MenuItem>
              </SubMenu>

            <SubMenu
              title={collapsedObject ? null : 'About'}  
              icon={collapsedObject ? <FaQuestion />  : null }
              >         
              <div className='about'>
                

              <p>
              <div>
                <button 
                  onClick={() => this.setState({ language: 'english' })}
                  style={{
                    fontWeight: this.state.language === 'english' ? 'bold' : 'normal',
                    textDecoration: this.state.language === 'english' ? 'none' : 'underline'
                  }}
                >
                  English
                </button>
                {' / '}
                <button 
                  onClick={() => this.setState({ language: 'deutsch' })}
                  style={{
                    fontWeight: this.state.language === 'deutsch' ? 'bold' : 'normal',
                    textDecoration: this.state.language === 'deutsch' ? 'none' : 'underline'
                  }}
                >
                  Deutsch
                </button>
              </div>
              </p>
              <p>
              {this.state.language === 'english' ? this.english : this.deutsch}
              </p>
              <p>
              Open Source Code: <button style={{textAlign: "left"}} onClick={() => window.open('https://github.com/Badisches-Landesmuseum/CSN', '_blank')}>https://github.com/Badisches-Landesmuseum/CSN</button>
              </p>
              </div>
              </SubMenu>
            </Menu>
          </ProSidebar>
          </div>
        </div>
        <div style={main_style}>
          <Projection
            ref={this.refProjection}
            width={main_style.width}
            height={main_style.height}
            embeddings_data={embeddings_data}
            mappings={mappings}
            metadata={metadata}
            previewPane_ctx={previewPane_ctx}
            previewPane_image_size={previewPane_image_size}
            setHoverIndex={this.setHoverIndex.bind(this)}
            algorithm_choice={algorithm_choice}
            datasetDir={this.props.datasetDir}
            clusterTypeSelected={clusterTypeSelected}
            greyRenderTypeSelected={greyRenderTypeSelected}
            settings={settings}
            initPath={this.props.initPath}
            scaleMin={this.state.scaleMin}
            scaleMax={this.state.scaleMax}
            currentProjection={currentProjection}
            clickOnImage={this.clickOnImage.bind(this)}
            // tiles={this.tiles}
          />
        </div>
      </div>
      
    ) : (
      <div className="loading"><CircularProgress color="inherit"/><div>loading layout...</div></div>
    )
  }
}

export default Layout



