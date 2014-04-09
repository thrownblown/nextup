/*
PLAN: 
  a. create master dictionary
    1. query database for all word nodes
    2. add word nodes to master dictionary
  b. doc insertion
    1. insert doc node
    2. check if word node is in master/server
       - if yes -> create relationship between doc and word
       - if no  -> create word node, create relationship between doc and word
  c. if doc and word insertion is successful, update master dictionar
  d. insert rest of doc recursively
*/

var rest = require('restler');

var batchURL = "http://localhost:7474/db/data/batch";
var cypherURL = "http://localhost:7474/db/data/cypher";

// helper functions
var consoleStart = function (data, title) {
  var title = title || "";
  console.log("\n\n");
  console.log("********** BEGIN " + title + " **********" + "\n\n");
  console.log(data);
  console.log("\n\n********** END " + title + " **********");
  console.log("\n\n");
};

var getNodeNum = function (nodeAddress) {
  var regexp = /[0-9]*$/g;
  return nodeAddress.match(regexp)[0];
};

var addToDict = function (result, master) {
  var len = result.data.length;
  console.log("len: ", len);

  for (var i = 0; i < len; i++) {
    var word = result.data[i][0].data.word;
    if (master[word] === undefined) {
      var loc  = result.data[i][0].self;
      var nodeNum = getNodeNum(loc);
      console.log("inside for: ", word, loc, nodeNum);

      // populating master dictionary
      master[word] = {};
      master[word].loc = loc;
      master[word].nodeNum = nodeNum;
      master[word].word = word;
    }
  }
  consoleStart(master, "Master Dict words");
};

// assumption: only create a master dictionary during big batch imports
// master dictionary has word and it's node location in the neo4j database
var masterDict = {};
var wordsToAdd = [];

var masterDictQuery = function () {
  var data = {};
  data.query = "MATCH (w:Word) RETURN w";
  return data;
};

var clearQuery = function () {
  var data = {};
  data.query = "MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r";
  return data;
};

// DUMMY DATA
var dummyDoc1 = {
  title : "greg one",
  url   : "http://www.gregorylull.com",
  words : {
    i    : 1,
    like : 1,
    dogs : 1
  },
  length : 3,
};

var dummyDoc2 = {
  title : "greg two",
  url   : "http://www.iamthelull.com",
  words : {
    i    : 1,
    want : 1,
    dogs : 1
  },
  length : 3,
};

var dummyDoc3 = {
  title : "greg three",
  url   : "http://www.glull.com",
  words : {
    i    : 1,
    need : 1,
    dogs : 1,
    too  : 1
  },
  length : 4,
};

// real data
var rd1 = {"rank":26,"title":"AngularStrap v2.0","url":"http://mgcrea.github.io/angular-strap","points":173,"username":"olouv","comments":37,"fileName":"angularstrapv20","wordtable":{"0":76,"toggle":60,"navigationtoggle":0,"angularjs":51,"native":11,"directives":69,"for":208,"twitter":52,"bootstrap":52,"angularstrap":51,"v1":4,"docsweve":2,"moved":2,"it":141,"to":723,"a":615,"new":2,"home":2,"while":2,"we":2,"push":2,"forward":2,"with":232,"docs":22,"looking":10,"docsgetting":0,"usageasideexamples":5,"started":7,"the":1317,"project":43,"is":182,"set":6,"of":240,"that":101,"enables":6,"seamless":6,"integration":14,"into":12,"your":25,"app":5,"no":18,"external":26,"dependency":41,"except":6,"css":84,"styles":42,"lighter":6,"and":166,"faster":6,"than":6,"ever":6,"as":209,"does":18,"leverage":27,"power":6,"nganimate":24,"from":207,"last":6,"stable":6,"release":13,"v20":6,"has":26,"landed":13,"in":179,"april":6,"after":6,"nearly":6,"months":6,"testing":6,"during":54,"this":94,"beta":6,"commits":6,"contributors":13,"thanks":6,"all":6,"testers":6,"made":6,"happenquick":5,"start":4,"install":21,"manage":5,"bower":21,"angularstrap200":7,"saveload":4,"required":29,"javascript":5,"libraries":5,"scripts":5,"files":5,"are":62,"not":59,"neededinject":5,"mgcreangstrapmodule":5,"mgcreangstrapcustom":5,"builds":5,"provides":6,"independently":6,"built":14,"modules":13,"can":262,"be":255,"loaded":32,"mgcreangstrapmodal":8,"mgcreangstrapaside":8,"contribute":4,"build":15,"work":5,"on":113,"grunt":28,"serve":15,"watch":7,"ideal":7,"hack":7,"continuous":7,"karmaserver":7,"buildanimations":4,"leverages":10,"nganimatemodule":5,"provide":5,"animations":12,"therefore":5,"requires":103,"load":11,"custom":117,"code":8,"nganimatecomes":5,"very":5,"specific":53,"markupangularmotion":4,"theses":28,"rely":6,"angularmotion":16,"savemodals":3,"modals":9,"streamlined":6,"but":6,"flexible":6,"dialog":6,"prompts":6,"minimum":6,"functionality":25,"smart":6,"defaultslive":6,"demo":55,"cloginfo":17,"scopemodal":5,"modal":130,"jsonclick":20,"modalusing":15,"an":204,"objectcustom":15,"animation":158,"backdrop":43,"being":23,"powered":62,"by":75,"opacity":89,"transition":24,"linear":8,"ampngenter":8,"ampngenteractive":8,"ampngleave":8,"ampngleaveactive":8,"usage":25,"append":102,"bsmodalattribute":6,"any":86,"element":238,"activate":6,"directivethe":11,"module":97,"also":47,"exposes":54,"modalservice":6,"available":70,"programmatic":47,"use":114,"inside":59,"controllerdemoctrl":29,"functionscope":29,"show":97,"basic":19,"controller":20,"var":51,"mymodal":9,"modaltitle":9,"my":39,"title":55,"content":120,"true":90,"prefetch":19,"template":186,"populated":19,"scope":102,"myothermodal":9,"modalscope":9,"when":152,"some":19,"event":19,"occurs":19,"promise":19,"property":19,"ensure":19,"been":19,"myothermodalshow":9,"options":131,"passed":60,"via":48,"dataattributes":41,"directive":78,"or":196,"object":93,"hash":41,"configure":41,"service":46,"data":104,"attributes":62,"option":96,"name":48,"dataanimation":17,"you":167,"naturally":20,"inherit":34,"contextual":20,"one":20,"expression":27,"evaluate":27,"directly":20,"bsmodal":6,"attributename":17,"type":93,"default":225,"string":281,"amfade":49,"apply":71,"nganimateplacement":35,"top":126,"how":49,"position":165,"bottom":43,"center":21,"csstitle":26,"value":112,"if":103,"titleattribute":32,"isnt":76,"presentcontent":26,"presenthtml":17,"boolean":129,"false":79,"replace":29,"ngbind":32,"ngbindhtml":32,"ngsanitize":32,"loadedbackdrop":17,"statictrue":19,"includes":43,"modalbackdrop":21,"alternatively":21,"specify":21,"staticfor":21,"which":69,"doesnt":21,"close":21,"clickkeyboard":17,"closes":29,"escape":32,"key":32,"pressedshow":26,"shows":29,"falseappends":39,"popover":82,"example":47,"container":67,"body":51,"particularly":47,"useful":47,"allows":47,"flow":47,"document":47,"near":47,"triggering":95,"will":47,"prevent":47,"floating":47,"away":47,"window":47,"resizetemplate":35,"path":69,"falseif":59,"provided":95,"overrides":59,"either":71,"remote":83,"url":83,"cached":71,"id":39,"should":35,"divmodal":11,"following":24,"conventions":23,"like":41,"thiscontenttemplate":17,"fetches":23,"partial":23,"inner":23,"idprefixevent":8,"modalif":9,"prefixes":11,"events":23,"hide":24,"hideafter":11,"showafter":11,"these":11,"modalhide":17,"modalhideafter":11,"modalshow":11,"override":55,"global":55,"defaults":55,"plugin":89,"amflipx":29,"methods":35,"visibilityshow":17,"reveals":17,"hides":17,"modaltoggle":5,"toggles":17,"modalasides":4,"asides":20,"panels":6,"drawers":6,"behavior":13,"modalsplugin":11,"require":47,"includedlive":11,"scopeaside":6,"aside":26,"asideusing":15,"datatemplatecustom":5,"part":15,"bootstraps":19,"core":15,"them":15,"must":15,"bootstrapadditions":15,"yet":15,"fully":15,"released":15,"meanwhile":15,"development":15,"snapshot":15,"compiled":15,"docsusage":5,"bsasideattribute":6,"enable":41,"pluginthe":17,"asideservice":6,"myaside":9,"asidetitle":9,"myotheraside":9,"asidescope":9,"myotherasideshow":9,"bsaside":13,"amfadeandslideright":9,"divaside":11,"iddefault":11,"amfadeandslideleft":9,"placement":69,"left":30,"asidehide":5,"asidetoggle":5,"asidealerts":4,"alerts":13,"styled":6,"tiny":6,"dialogs":6,"scopealert":5,"alert":85,"alertusing":23,"objectclick":7,"dataattrscustom":7,"datatemplateusage":5,"bsalertattribute":6,"alertservice":6,"myalert":9,"alerttitle":9,"holy":9,"guacamole":9,"best":9,"check":9,"yo":9,"self":9,"youre":9,"too":9,"good":9,"info":19,"topleft":10,"topright":10,"presenttype":8,"datatypeattribute":10,"presentkeyboard":8,"amfadeandslidetop":29,"alerthide":5,"alerttoggle":5,"alertbuttons":4,"do":5,"more":13,"buttons":14,"control":6,"button":13,"states":6,"create":6,"groups":6,"components":6,"toolbars":5,"two":13,"bscheckbox":6,"bsradio":6,"used":6,"trigger":19,"checkbox":6,"radio":6,"behaviorgroup":5,"shortcuts":6,"bscheckboxgroup":7,"bsradiogroup":7,"easily":7,"setup":7,"proper":12,"markup":7,"at":7,"compile":7,"timelive":5,"cloginfoscopebutton":5,"jsontoggle":6,"middle":8,"rightradiosfirst":6,"second":9,"thirdtype":5,"support":6,"handle":7,"both":19,"strings":7,"numbers":7,"booleans":7,"valuesselects":3,"add":16,"quick":13,"dynamic":13,"select":30,"form":11,"text":23,"inputplugin":10,"selects":9,"tooltip":12,"parseoptions":7,"helper":12,"loadedlive":5,"scopeselectedicon":6,"iconssingle":6,"action":15,"multiple":32,"bsselectattribute":6,"selectservice":6,"mainly":23,"dom":7,"elementvar":23,"myselect":9,"selectelement":9,"controlleroptions":5,"dataanimationthis":5,"supports":7,"exotic":14,"corners":7,"such":7,"bottomleft":19,"other":7,"combination":18,"docsname":5,"typeahead":69,"right":10,"bottomlefttrigger":8,"focus":20,"triggered":10,"click":12,"hover":10,"manualhtml":8,"loadeddelay":8,"number":93,"0delay":9,"showing":11,"hiding":11,"ms":11,"manual":13,"supplied":11,"delay":27,"applied":11,"hideshow":10,"structure":11,"typeaheadif":9,"idmultiple":8,"falsewhether":9,"selections":11,"allowedmaxlength":8,"selected":13,"values":12,"displayed":23,"inlinemaxlengthhtml":8,"selectedplaceholder":9,"overflowed":11,"selectionsort":8,"truesort":9,"order":11,"labelsplaceholder":8,"choose":9,"among":10,"selecteddefault":5,"sort":12,"datepickers":9,"datepicker":4,"dateparser":4,"loadedsupport":4,"locales":4,"locale":4,"just":4,"have":4,"i18n":4,"file":4,"seamlessly":4,"translate":4,"datepickerslive":4,"scopeselecteddate":4,"selecteddate":4,"modalexamples":5,"usagemodalexamples":10,"usageusage":5,"scrollspyservice":6,"scrollspy":16,"scrollspyelement":9,"optionsoptions":18,"dataanimationname":17,"descriptiontarget":7,"target":10,"selectoroffset":8,"pixels":49,"offset":55,"screen":32,"calculating":54,"scrolldefault":11,"affix":38,"subnavigation":8,"live":8,"pluginplugin":6,"helpersdimensions":10,"loadedusage":5,"bsaffixattribute":6,"bsaffixtarget":6,"attribute":6,"added":6,"parent":17,"elementthe":5,"affixservice":6,"affixelement":9,"scrolloffsetbottom":8,"scrolloffsetparent":8,"scrolloffsetunpin":8,"unpin":10,"tabs":14,"tab":6,"through":6,"panes":6,"local":6,"contentlive":6,"scopetabs":5,"jsonactivetab":6,"tabsactivetab":6,"bstabsattribute":6,"directivecustom":5,"pane":6,"done":7,"ngclassactive":7,"callbacks":7,"csstabsamfade":6,"tabpane":8,"ease":8,"minheight60px":8,"ampactiveadd":8,"display":17,"block":8,"ampactiveaddactive":8,"ampactiveremove":8,"none":8,"bstabs":6,"nganimatetemplate":8,"templatedefault":5,"getting":3,"startedgetting":0,"usagemodal":0,"examples":2,"asideexamples":0,"usageaside":0,"examplesusage":11,"tooltipexamples":0,"usagetooltip":0,"tabexamplesusagetab":0,"usagegetting":0,"savegetting":1,"readmemd":0,"about":1,"happen":0,"projectangularstrap":0,"appwith":0,"startinstall":0,"bowerbower":0,"save":4,"buildsangularstrap":0,"angularmodulemyapp":21,"contributebuild":0,"gruntgrunt":0,"modalmodals":1,"modaljs":0,"datatemplateclick":2,"using":6,"datatemplate":4,"animationbackdrop":0,"modalbackdropamfade":0,"usageappend":1,"directivebsmodal":0,"modalshowaftername":1,"descriptionname":6,"description":6,"backdropanimation":0,"cssrequires":2,"present":6,"titlestringdefault":2,"presenttitle":2,"presentdatacontent":2,"html":2,"backdropboolean":1,"static":1,"statictrueincludes":1,"clickstatic":1,"keyboard":2,"pressed":5,"initialized":5,"falsefalse":3,"appends":7,"resize":3,"resizecontainer":3,"idit":1,"thisdivmodallike":0,"contenttemplate":1,"prefixevent":0,"modalshowafter":1,"optionsyou":7,"methodsmethods":2,"modalhidehides":0,"modaltoggletoggles":0,"asideasides":1,"asidejs":0,"included":1,"dependencyasides":0,"includedmodal":1,"pluginlive":1,"requiredasides":0,"snapshotusageappend":0,"pluginbsaside":0,"idname":3,"idanimation":1,"thisdivasidelike":0,"asidehidehides":0,"asidetoggletoggles":0,"alertalerts":1,"alertjs":0,"dependencyalerts":0,"dataattrs":0,"pluginbsalert":0,"placementstringhow":0,"presentdatatype":0,"idtemplatepathfalse":0,"alerthidehides":0,"alerttoggletoggles":0,"valuesbuttons":1,"buttonjs":0,"toolbarsthis":0,"group":1,"time":0,"shortcutsuse":0,"rightleft":0,"rightradios":0,"first":0,"thirdfirst":0,"third":0,"supporttheses":0,"selectjs":0,"input":0,"dependencyselects":0,"loadedtooltip":0,"moduleparseoptions":0,"helperlive":0,"single":0,"directivebsselect":0,"controllerthe":0,"controllervar":1,"twobottomleftexotic":0,"snapshotname":0,"selectedname":1,"selectedanimation":0,"nganimatenganimate":1,"delaynumber":0,"object0":0,"typeif":0,"hideshowobject":0,"idtemplatepath":0,"idtypeahead":0,"whether":1,"allowed":1,"maxlength":0,"maximum":1,"inline":1,"maxlengthhtml":0,"placeholder":4,"selection":1,"labels":1,"loadedmodalexamples":0,"scrollspyjs":0,"dependencyscrollspy":0,"usageusageappend":0,"pluginbsscrollspy":0,"optionsthe":1,"optionsvar":3,"scrollname":3,"scrolltarget":0,"selector":1,"scroll":9,"offsetnumber0pixels":0,"affixjs":0,"dependencyaffix":0,"pluginbsaffixyou":0,"scrolloffsettop":0,"offsetbottom":0,"offsetparent":0,"offsetunpin":0,"tabjs":0,"thirdusageappend":0,"directivebstabs":0,"animationspane":0,"tabsamfade":0,"templatename":1,"templateanimation":0,"back":1,"topdesigned":3,"olivier":4,"louvignes":3,"follow":3,"olouvusing":3,"designed":3,"mdo":3,"fat":2,"licensed":3,"under":7,"mit":4,"license":3,"documentation":3,"cc":3,"roadmap":4,"changelog":4,"releasesback":2,"olouv":0,"louvignesfollow":0,"fattwitter":0,"bootstrapbootstraps":0,"stylesmdofatcode":0,"licensecc":0,"issues":0,"releasesissues":0,"issuesroadmap":0,"changelogreleases":0,"releases":0,"gacreate":0,"ua18133038":0,"mgcreagithubio":0,"gasend":0,"pageviewfunction":0,"po":0,"potype":0,"textjavascript":0,"poasync":0,"posrc":0,"https":1,"http":0,"s":1,"functiondsidvar":0},"wordcount":20637}
var rd2 = {"rank":4,"title":"Atlassian Valued at $3.3 Billion","url":"http://blogs.wsj.com/digits/2014/04/08/atlassian-valued-at-3-3-billion-selling-business-software-sans-salespeople/","points":260,"username":"asaddhamani","comments":128,"fileName":"atlassianvaluedat33billion","wordtable":{"wsj":43,"facebook":27,"twitterlive":4,"live":17,"marketwatch":13,"barrons":13,"portfolio":42,"product":40,"x":13,"shops":14,"the":472,"more":49,"newsprofessor":6,"journalvirtual":6,"stock":26,"exchangewsj":6,"classifiedswsj":6,"classroomwsj":6,"radiowsj":6,"resources":12,"ltd":12,"adsusview":6,"all":35,"search":12,"results":10,"wall":18,"street":24,"journalmenuhomepage":4,"world":9,"us":27,"new":41,"york":9,"business":40,"tech":40,"markets":23,"market":23,"data":16,"opinion":9,"life":9,"amp":85,"culture":9,"real":27,"estate":18,"management":20,"cio":9,"journal":30,"cfo":9,"risk":9,"compliancealso":7,"in":270,"wsjcomlatest":8,"news":65,"todays":9,"paper":9,"most":48,"popular":16,"streams":9,"tbd":9,"video":22,"blogseditionsus":9,"asia":13,"europeamrica":10,"latina":13,"spanish":11,"brasil":11,"portuguese":11,"simplified":13,"chinese":27,"traditional":13,"japanese":12,"korean":12,"indonesia":11,"bahasa":11,"india":18,"english":11,"deutschland":11,"german":11,"russian":23,"trkiye":11,"turkishlog":4,"inprofile":5,"my":9,"saved":9,"old":16,"customize":9,"alerts":9,"community":20,"customer":11,"center":16,"logoutmessage":1,"postsvideo":17,"digits":28,"from":127,"asiaall":12,"asiaeuropeall":6,"poststech":17,"europeall":12,"europehot":4,"topics":13,"savings":7,"calculator900":2,"am":6,"etapr":6,"cloud":7,"atlassian":100,"valued":16,"at":65,"billion":40,"selling":23,"software":44,"sans":16,"salespeople":29,"articlecomments":5,"twitter":51,"google":38,"pluslinked":20,"inemail":25,"printfacebook":9,"plus":10,"linked":10,"print":16,"ltcdata":6,"var":22,"jsexec":27,"consolegroupdj":6,"consoleinfo":13,"begin":6,"catch":16,"e":6,"fnc":48,"function":6,"console":6,"log":7,"info":6,"error":28,"dir":6,"group":6,"groupend":6,"end":6,"consolegroupend":6,"gt":6,"lang":6,"enus":6,"by":52,"douglas":7,"popups":7,"dojoconnectpopup":7,"onclick":15,"functione":15,"me":36,"close":7,"others":7,"if":16,"popup":7,"popclosed":23,"popopen":23,"openclose":7,"just":39,"this":83,"one":54,"dojotoggleclassme":15,"dojostopevente":7,"dojoconnectdocument":7,"founders":26,"and":330,"cochief":15,"executives":8,"scott":15,"farquhar":43,"mike":15,"an":92,"australian":6,"maker":13,"of":264,"online":27,"collaboration":13,"tools":19,"for":150,"businesses":13,"is":142,"gunning":6,"same":6,"as":52,"fastgrowing":6,"startup":13,"box":86,"inc":33,"like":27,"also":39,"now":33,"worlds":6,"valuable":6,"venturebacked":6,"companies":48,"with":164,"a":291,"investment":20,"valuing":20,"company":130,"billionthe":6,"similarities":6,"stop":6,"thereatlassian":6,"founded":13,"executive":6,"officers":6,"cannonbrookes":27,"builds":6,"to":368,"help":13,"it":105,"departments":6,"computer":6,"programmers":6,"other":20,"professionals":6,"work":6,"together":6,"its":139,"several":17,"young":6,"technology":22,"including":22,"workday":6,"move":6,"applications":6,"web":23,"lowering":6,"cost":6,"licenses":6,"freeing":6,"workers":6,"store":15,"access":6,"files":13,"anywherebut":5,"breaking":25,"mold":6,"enterprise":6,"which":13,"invest":6,"heavily":13,"employ":13,"armies":6,"push":6,"products":27,"customersatlassian":6,"doesnt":6,"single":6,"salesperson":6,"money":13,"saves":6,"invests":6,"on":87,"research":20,"development":13,"building":6,"aim":6,"that":98,"they":33,"are":31,"good":13,"enough":6,"spread":6,"word":6,"mouth":6,"helped":6,"along":6,"modest":6,"marketing":13,"budget":6,"billboards":6,"adsfifteen":6,"years":41,"ago":6,"long":17,"you":76,"had":13,"best":16,"distribution":6,"would":13,"win":6,"mr":27,"said":41,"interview":6,"didnt":6,"matter":6,"whether":6,"oracle":6,"was":6,"worse":6,"than":36,"sap":6,"these":6,"days":6,"people":17,"making":13,"decisions":6,"based":6,"how":13,"aremr":6,"profitable":6,"result":6,"has":94,"been":36,"cashflow":6,"positive":6,"each":6,"quarter":6,"past":6,"sales":48,"have":45,"risen":6,"average":6,"annually":6,"over":34,"last":41,"five":6,"revenue":34,"runrate":6,"or":24,"amount":6,"generate":6,"extrapolating":6,"current":6,"next":7,"months":6,"millionatlassians":6,"profitability":6,"stands":6,"stark":6,"contrast":6,"onlinestorage":6,"three":16,"later":6,"month":6,"filed":6,"public":34,"ipo":42,"prospectus":6,"year":34,"doubled":6,"million":34,"but":42,"racked":6,"up":30,"loss":6,"nearly":13,"spent":13,"costs":13,"commissions":6,"advertising":13,"compensation":6,"negative":6,"operating":6,"cash":31,"flow":6,"millionatlassian":6,"says":17,"spends":6,"annual":6,"much":17,"greater":6,"share":6,"about":35,"rampda":6,"spokeswoman":6,"declined":6,"comment":21,"citing":6,"quietperiod":6,"restrictions":6,"going":13,"publicatlassians":6,"could":6,"grow":6,"time":13,"however":6,"initially":6,"served":6,"small":6,"teams":6,"developers":6,"who":27,"often":13,"seek":6,"out":31,"highestquality":6,"their":38,"own":6,"expands":6,"aims":6,"sell":34,"larger":15,"may":20,"need":6,"bring":6,"can":6,"manage":6,"those":6,"relationships":6,"thomas":6,"murphy":13,"director":6,"gartner":6,"organizations":6,"use":22,"july":6,"not":65,"developer":6,"decision":6,"any":6,"trying":6,"figure":6,"where":17,"do":33,"we":28,"service":7,"really":6,"big":13,"accounts":6,"want":6,"guyatlassian":6,"differs":6,"private":6,"size":6,"never":6,"taking":6,"direct":6,"injection":6,"outside":13,"funding":41,"companys":6,"previous":20,"accel":27,"partners":6,"atlassians":13,"employees":20,"will":27,"some":41,"shares":43,"valuation":20,"according":13,"person":13,"familiar":13,"transaction":6,"tender":6,"offer":6,"t":13,"rowe":13,"price":13,"dragoneer":13,"capital":6,"purchase":6,"existing":6,"shareholdersbecause":6,"generating":6,"every":6,"then":17,"reinvests":6,"no":24,"hurry":6,"raise":6,"dont":6,"pressure":6,"get":6,"through":6,"offering":6,"he":6,"saidstill":6,"worked":6,"there":6,"needed":13,"give":6,"them":28,"liquidity":6,"puts":6,"off":6,"be":34,"able":6,"portion":13,"secondary":6,"financing":13,"only":6,"backer":6,"rich":6,"wong":6,"partner":8,"member":6,"board":6,"mssrs":6,"cashed":6,"roundatlassians":6,"roughly":6,"eight":6,"times":17,"when":13,"purchased":6,"matteratlassian":6,"chose":6,"because":6,"expertise":6,"eventually":6,"comes":6,"saidatlassians":6,"jira":6,"system":6,"creating":6,"tracking":6,"servicedesk":6,"tickets":6,"across":6,"organization":6,"added":24,"confluence":6,"tool":16,"team":6,"documentsharing":6,"stash":6,"application":6,"sharing":6,"code":24,"hipchat":6,"chat":6,"program":6,"acquired":6,"types":6,"services":6,"say":15,"intention":6,"competing":6,"directly":13,"players":6,"microsoft":19,"corp":6,"crowded":6,"storage":6,"feature":13,"around":6,"storing":6,"hanger":6,"were":17,"hang":6,"our":42,"hat":6,"saidatlassian":6,"competes":6,"rally":6,"went":6,"github":13,"san":6,"franciscobased":6,"raised":13,"round":13,"millionevelyn":6,"m":6,"rusli":6,"contributed":6,"articlecorrection":6,"version":6,"article":18,"incorrectly":6,"reported":6,"came":6,"previousapple":5,"closes":16,"adspending":16,"gap":16,"samsung":47,"nextwearable":6,"chip":6,"emerges":6,"backers":5,"home":12,"page":16,"add":4,"message":8,"name":17,"welcome":8,"thoughtful":8,"comments":33,"readers":17,"please":32,"comply":8,"guidelines":9,"blogs":8,"require":8,"your":93,"view":8,"pm":54,"april":65,"lam":10,"wrote":54,"why":10,"compare":10,"bitbucketer":10,"late":10,"joke":10,"continually":10,"fleeces":10,"customers":21,"pushing":10,"another":10,"decides":10,"upgrade":10,"hosted":10,"versions":10,"critical":10,"functionality":10,"removed":10,"refuses":10,"roll":10,"back":15,"fix":10,"support":21,"so":10,"pathetic":10,"disconnected":10,"reality":10,"might":10,"well":10,"skip":10,"straight":10,"forumstheyve":10,"tried":21,"zero":10,"interest":10,"ploy":10,"before":10,"bubble":10,"completely":10,"bursts":9,"fodder":10,"make":10,"ugly":10,"confusing":10,"interfaces":10,"pay":10,"former":11,"mostly":10,"bullocks":10,"hiding":10,"plainsight":10,"tells":10,"story":30,"having":10,"appetite":10,"theyve":10,"yrs":10,"perspective":10,"without":10,"doubt":10,"worst":10,"industry":10,"mention":10,"realgrowth":10,"behind":10,"profit":10,"margins":10,"nowhere":10,"near":10,"should":10,"behemoth":10,"whattheheck":10,"cheers":10,"mates":9,"taylor":10,"likely":10,"ticker":10,"feeds":10,"pickupsearch":3,"digits1latest":4,"wsjd":6,"encryption":9,"flawed":9,"researchers":9,"puzzle":9,"game":9,"monument":9,"valley":9,"sweeps":9,"app":9,"employee":9,"ballmer":9,"gets":30,"office":9,"ipad":9,"credit":9,"too":8,"race":9,"locate":9,"users":8,"apple":23,"seeks":9,"damages":9,"patent":9,"trial":8,"latest":9,"personal":7,"sun":9,"sets":9,"windows":19,"xp":19,"todaybut":9,"youll":9,"ok":8,"galaxy":9,"s5":9,"review":19,"watertight":9,"yet":9,"still":9,"quite":9,"right":8,"gear":9,"fit":9,"smartwatch":9,"shape":8,"highflying":8,"camera":20,"dji":20,"phantom":20,"vision":20,"drone":20,"promises":9,"stabilized":9,"hd":9,"askwsjd":8,"apps":10,"digitsrssdigits":5,"delivers":8,"insights":8,"landscape":8,"qampas":8,"newsmakers":8,"strategic":8,"moves":8,"send":17,"items":8,"questions":8,"digitswsjcomdigits":7,"facebookcloseemail":5,"thisrecipients":12,"email":100,"address":61,"separate":20,"multiple":31,"commasyour":18,"addressmessage":18,"optionalsend":16,"copyor":18,"cancelclosethank":4,"sentcloseerror":6,"occured":14,"sent":14,"try":16,"again":11,"invalid":17,"cant":8,"enter":26,"emails":15,"seperate":8,"addresses":8,"commas":8,"must":17,"verification":17,"below":8,"entry":8,"type":8,"againpopular":5,"nowwhats":6,"thisclosecontent":7,"engaging":8,"additional":8,"prominence":8,"accorded":8,"rapidly":8,"gaining":8,"attention":8,"algorithm":8,"comprises":8,"views":8,"comments1the":6,"mickey":10,"rooney":10,"role":10,"nobody":10,"wants":10,"talk":10,"phone":10,"seconds":10,"israeli":10,"firm":10,"learn":10,"applein":10,"recovered":10,"jobs":11,"lost":10,"recession":10,"men":10,"ai":10,"more6uber":6,"launch":10,"bikecourier":10,"serious":10,"put":10,"women":10,"bad":10,"heir":10,"selfie":9,"makes":9,"look":9,"pounds":9,"lighter447next":7,"week":9,"saying":9,"goodbye":9,"fire":9,"tv":9,"centeran":6,"slice":6,"content":2,"links":2,"actual":3,"containing":3,"functionality15wall":2,"linkedin":4,"foursquare":4,"youtube":4,"podcasts":4,"rss":4,"feed":4,"appstoresubscribe":4,"login":6,"topcustomer":4,"servicecustomer":5,"centernew":7,"helpcontact":6,"uswsj":7,"weekendcontact":7,"directory":6,"policy":28,"cookie":7,"copyright":11,"subscriber":6,"agreementamp":8,"terms":8,"ad":15,"place":6,"classified":8,"commercial":6,"ads":13,"recruitment":6,"career":8,"franchising":6,"advertise":8,"locally":7,"featuresapps":5,"alertsgraphics":6,"columns":6,"guides":6,"portfoliomorewhy":4,"subscribe":13,"register":6,"free":6,"reprintscontent":6,"partnerships":6,"conferencesmobile":6,"siteprice":7,"volume":6,"keyword":6,"symbolnews":7,"archivejobs":4,"dow":5,"jones":6,"rights":5,"reservedschlieen":0,"nowwsj":0,"newwsj":0,"winewsj":1,"twitterwsj":0,"livelive":0,"barronsbarrons":0,"portfolioportfolio":0,"xproduct":0,"djx":0,"rt":1,"f":1,"rampc":1,"peampvc":1,"b":1,"shopsthe":0,"winemore":0,"briefcase":1,"bigcharts":1,"financial":1,"professor":1,"smartmoney":1,"student":1,"virtual":1,"exchange":1,"classifieds":1,"classroom":1,"radio":1,"wine":0,"adsusgoldrangold":0,"adsgoldusview":0,"logoutthe":2,"menuhomepage":0,"turkishmenuhomepage":1,"turkishhomepage":0,"compliancehomepage":0,"yorknew":0,"datamarket":0,"culturelife":0,"culturereal":0,"estatereal":0,"journalcio":0,"journalcfo":1,"journalrisk":0,"compliancerisk":0,"compliance":0,"turkishalso":0,"wsjcom":0,"turkishlatest":0,"newslatest":0,"newstodays":0,"papertodays":0,"papermost":0,"popularmost":0,"popularstreams":0,"tbdstreams":0,"editionsus":0,"turkisheditions":0,"europe":3,"amrica":1,"turkish":0,"spanishamrica":0,"portuguesebrasil":0,"chinesesimplified":0,"chinesetraditional":0,"japanesejapanese":0,"bahasaindonesia":0,"bahasabahasaindia":0,"englishindia":0,"germandeutschland":0,"germangermanrussian":0,"russianrussian":0,"turkishtrkiye":0,"turkishturkishlog":0,"inlog":1,"logoutprofile":3,"logout":0,"profileprofilemy":0,"newsmy":0,"portfolioold":1,"portfoliocustomize":0,"watchlistcustomize":0,"alertsnewsletters":0,"centercustomer":1,"centerlogoutlogout":0,"newmessage":2,"amazon":1,"blackberry":3,"intel":3,"yahoo":1,"mediasocial":0,"asiaasia":0,"posts":7,"europeeurope":0,"hot":1,"calculator":1,"bitcoin":1,"alibaba":1,"nsa":1,"surveillance":1,"wireless":1,"pickup900":0,"smaller":1,"largerfacebook":0,"plusgoogle":1,"inlinked":1,"infacebook":0,"anywhereworkdaybut":0,"backersdigits":0,"pagedigits":0,"pageadd":0,"namewe":0,"pickup":4,"lamwhy":0,"boxwhy":0,"bitbucketeris":0,"burstsis":0,"fodderthey":0,"thatthey":0,"atlassianthis":0,"matesthis":0,"taylorits":0,"pickupits":0,"digits1search":1,"digits1":0,"wsjdlatest":0,"sayweb":0,"storenew":0,"toomicrosoft":0,"usersthe":0,"samsungapple":0,"trialapple":0,"techlatest":0,"okthe":0,"rightsamsung":0,"shapesamsung":0,"videohighflying":0,"newsaskwsjd":0,"facebookabout":0,"digitsrssabout":0,"rssrssrssrss":0,"facebookdigits":2,"cancelcloseemail":5,"cancelclose":1,"closeemail":1,"recipients":1,"cancelrecipients":3,"commasrecipients":1,"commasseparate":1,"addressyour":1,"optionalmessage":1,"copysend":1,"cancelor":1,"sentclosethank":5,"sentclose":1,"closethank":1,"youyour":1,"againcloseerror":5,"againclose":1,"closeerroran":1,"lesspopular":0,"commentswhats":0,"more1the":1,"aboutthe":0,"itcharge":0,"comicsmbas":0,"haventwomen":0,"more5microsoft":0,"springmicrosoft":0,"moreshow":0,"less6uber":1,"serviceuber":0,"promiseshighflying":0,"androidtwitter":0,"chargehow":0,"less10when":0,"daywhen":0,"lessshow":0,"lighter447a":0,"lightera":0,"top":1,"reservedwsj":0,"functionality15wsj":0,"slicecontentlinks":0,"reservedwall":1,"journalwall":0,"feedrss":0,"topback":0,"archivecustomer":0,"correctionscustomer":0,"corrections":0,"helpnew":0,"helpnewcontact":0,"uscontact":0,"weekendwsj":0,"directorycontact":0,"policyprivacy":1,"choicespolicy":0,"privacy":1,"choices":1,"policycookie":0,"policydata":1,"policycopyright":1,"policysubscriber":0,"usesubscriber":0,"useyour":0,"choicesyour":0,"advertiseadvertise":0,"adplace":0,"adsell":0,"homesell":1,"businesssell":0,"businesscommercial":0,"adscommercial":0,"adsrecruitment":1,"locallyadvertise":0,"portfoliotools":0,"features":0,"appsappsemails":0,"alertsemails":0,"morewhy":0,"archivemore":0,"archive":0,"subscribewhy":0,"subscriberegister":0,"freeregister":0,"partnershipscontent":0,"sitemobile":0,"volumeprice":0,"volumekeyword":0,"symbolkeyword":0,"archivenews":0,"reserved":0,"wsjjobs":0,"wsjcopyright":0,"reserveddow":0,"companyschlieen":0,"nowschlieen":3,"nowcloseemail":0},"wordcount":15542}
var rd3 = {"rank":16,"title":"AWS Services Updated to Address OpenSSL Vulnerability","url":"https://aws.amazon.com/security/security-bulletins/aws-services-updated-to-address-openssl-vulnerability/","points":68,"username":"breadtk","comments":5,"fileName":"awsservicesupdatedtoaddressopensslvulnerability","wordtable":{"english":14,"deutsch":12,"espaol":12,"franais":12,"portugus":12,"my":13,"account":27,"console":33,"aws":1055,"management":143,"billing":14,"amp":479,"cost":18,"security":79,"credentialssign":4,"upaws":1,"products":137,"solutions":30,"cloud":258,"computingcompute":5,"networking":12,"storage":229,"cdn":13,"database":191,"analytics":40,"application":97,"services":75,"deployment":28,"marketplace":195,"softwarestartups":5,"enterprises":36,"government":58,"educationweb":5,"mobile":119,"social":78,"apps":132,"digital":31,"media":56,"marketing":36,"business":120,"applications":95,"backup":43,"archive":35,"dr":12,"big":31,"data":188,"hpcaws":5,"partner":50,"networkaws":7,"computingwhat":11,"is":43,"computinglearn":11,"more":108,"about":94,"computing":38,"with":84,"awschoosing":8,"a":59,"platformcloud":11,"platform":16,"evaluation":11,"checklistglobal":8,"infrastructurefind":11,"regions":18,"and":656,"edge":11,"locations":11,"around":11,"the":399,"worldcustomer":8,"success":25,"storieswhats":9,"newmedia":9,"coverageanalyst":8,"blogaws":12,"supporttechnical":11,"support":46,"available":23,"by":134,"find":17,"calculators":22,"other":34,"tools":70,"to":256,"help":34,"you":69,"lower":22,"costs":11,"learn":54,"how":40,"build":33,"secure":45,"architecture":16,"scalable":46,"reliable":10,"in":233,"compute":19,"networkingamazon":8,"ec2virtual":11,"servers":11,"cloudauto":8,"scalingelastic":9,"load":47,"balancingamazon":9,"workspacesvirtual":11,"desktops":11,"cloudamazon":30,"vpcisolated":11,"resourcesamazon":9,"route":18,"domain":11,"name":11,"system":16,"dnsaws":8,"direct":18,"connectdedicated":11,"network":44,"connection":11,"awsaws":12,"citrix":12,"netscaler":22,"riverbed":11,"stingray":11,"traffic":11,"manager":11,"brocade":11,"vyatta":11,"vrouter":11,"view":131,"all":163,"related":131,"try":115,"for":448,"free":438,"get":133,"started":147,"now":146,"tier":307,"includes750":17,"hours":179,"of":463,"amazon":289,"ec2":31,"running":31,"linux":146,"or":54,"windows":114,"micro":109,"instances":33,"each":46,"month":39,"one":61,"year":49,"details":153,"cdnamazon":9,"s3scalable":11,"glacierlowcost":11,"ebsec2":11,"block":91,"volumesaws":8,"importexportlarge":11,"volume":11,"transferaws":9,"gatewayintegrates":11,"onpremises":11,"it":35,"environments":18,"storageamazon":8,"cloudfrontglobal":11,"content":46,"delivery":22,"cdnaws":8,"softnas":11,"helix":11,"universal":11,"server":81,"pro":11,"aiscaler":11,"includes5":8,"gb":269,"s3":14,"standard":9,"ebs":14,"databaseamazon":8,"rdsmanaged":11,"relational":11,"service":73,"mysql":45,"oracle":38,"sql":33,"postgresqlamazon":9,"dynamodbfast":11,"predictable":11,"highlyscalable":11,"nosql":11,"storeamazon":9,"elasticacheinmemory":11,"caching":20,"serviceamazon":61,"redshiftfast":23,"powerful":35,"fully":23,"managed":23,"petabytescale":23,"warehouse":23,"serviceaws":17,"scalearc":11,"idb":11,"enterprise":50,"parelastic":11,"virtualization":11,"engine":23,"monyog":11,"rds":26,"monitor":11,"advisor":11,"includes20":8,"ms":9,"mb":9,"units":19,"write":9,"capacity":19,"read":9,"dynamodb":14,"analyticsamazon":8,"emrhosted":11,"hadoop":11,"frameworkamazon":9,"kinesisrealtime":11,"stream":23,"processingaws":8,"periodic":11,"datadriven":11,"workflowsamazon":8,"jaspersoft":12,"reporting":33,"microstrategy":11,"sap":40,"objects":13,"servicesamazon":8,"appstreamlowlatency":11,"streamingamazon":9,"cloudsearchmanaged":11,"search":11,"swfworkflow":11,"coordinating":11,"componentsamazon":9,"sqsmessage":11,"queue":11,"sesemail":11,"sending":11,"snspush":11,"notification":11,"fpsapi":11,"based":11,"payment":18,"elastic":67,"transcodereasytouse":11,"transcodingaws":8,"nginx":11,"adobe":11,"coldfusion":11,"includes100000":8,"requests":29,"http":10,"notifications":9,"sns":14,"sqs":14,"managementaws":10,"consolewebbased":11,"user":28,"interfaceaws":9,"identity":27,"access":39,"iamconfigurable":11,"controlsaws":9,"cloudtrailuser":11,"activity":11,"change":11,"trackingamazon":8,"cloudwatchresource":11,"monitoringaws":8,"beanstalkaws":13,"containeraws":9,"resource":11,"creationaws":9,"opsworksdevops":11,"servicesaws":9,"key":11,"regulatory":11,"complianceaws":9,"redmine":11,"mbridge":11,"systems":31,"trac":11,"turnkey":23,"includes10":8,"metrics":9,"alarms":9,"api":10,"cloudwatch":14,"software":58,"preconfigured":10,"run":17,"on":413,"awsinfrastructure":8,"stacksoperating":9,"systemsdatabases":9,"cachingnetwork":9,"bug":41,"softwarecitrix":8,"vpx":10,"platinum":9,"gartner":9,"magic":10,"quadrant":10,"leader":21,"commercial":9,"open":10,"source":19,"built":10,"awsdebian":8,"debianorgstartups":6,"awsstartups":9,"use":35,"everything":11,"their":32,"app":11,"needs":11,"launch":11,"few":11,"clicks":11,"without":11,"up":18,"front":11,"costslearn":35,"startups":35,"startup":15,"challengelearn":11,"annual":11,"competition":11,"celebrate":11,"awsweb":9,"socialpower":11,"web":70,"cloudbig":8,"datastore":11,"process":23,"large":23,"datasets":23,"solve":35,"problemstry":7,"includescompute":71,"instancesstorage":79,"object":79,"storagesql":79,"storageaws":80,"awsenterprises":9,"deliver":23,"innovation":23,"globally":23,"improving":23,"agility":23,"resiliency":23,"while":23,"reducing":23,"applicationsrun":11,"cloudbackup":8,"storagestore":11,"retrieve":23,"any":54,"anywhere":23,"timesecurity":8,"centerlearn":11,"centerfind":11,"coststry":7,"educationpublic":8,"sector":11,"organizations":11,"education":29,"federal":15,"governmentrun":11,"missioncritical":11,"your":128,"agencystate":8,"local":18,"governmentdrive":11,"efficiencies":11,"through":23,"at":18,"every":11,"level":11,"demanding":11,"research":11,"course":11,"objectives":11,"solutionsaws":13,"govcloud":18,"us":19,"regionfeaturing":11,"fips":11,"compliant":11,"end":11,"points":11,"oriented":11,"workloadstry":7,"appsweb":9,"awspower":11,"cloudsocial":8,"awsrun":47,"that":67,"easily":11,"respond":11,"viral":11,"growthgaming":8,"awsdeliver":11,"casual":11,"massive":11,"multiplayer":11,"online":23,"mmo":11,"gamesmedia":8,"sharing":18,"awsshare":11,"photos":11,"videos":17,"contentecommerce":8,"site":38,"lowcost":23,"storesmobile":8,"awsquickly":11,"create":12,"backend":11,"cloudaws":17,"aimobile":11,"magento":11,"bitnami":23,"zurmo":11,"marketingdigital":10,"mediaingest":11,"store":13,"encode":11,"protect":18,"mediadigital":11,"marketingrun":11,"campaigns":11,"websites":16,"cloudmarketing":9,"websitesrun":11,"highly":11,"sites":11,"openemm":11,"jumpbox":11,"promedia":11,"carbon":11,"mp":11,"wordpress":11,"cloudoracleoracle":8,"ebusiness":11,"suite":11,"hyperionsaprapid":8,"sharepoint":23,"serveraws":8,"businessobjects":11,"jd":11,"edwards":11,"enterpriseone":11,"drbackup":9,"awsstore":23,"timedisaster":8,"recovery":18,"awsrecover":11,"quickly":11,"from":35,"disasterarchiving":8,"awsarchive":11,"longterm":11,"retentionaws":8,"cloudberry":11,"message":11,"logic":11,"ml":11,"archiver":11,"cloudyscripts":11,"ami":18,"hpcbig":9,"problemshpc":9,"tightlycoupled":11,"iointensive":11,"workloads":12,"complex":11,"science":11,"engineering":11,"problemsaws":8,"intel":11,"edition":11,"lustre":11,"univa":11,"grid":11,"click":11,"stackiq":11,"rocks":11,"networkfind":8,"partnersfind":12,"qualified":11,"apn":42,"partners":34,"projectsjoin":8,"networklearn":11,"benefits":11,"requirements":11,"programlogin":8,"portaldownload":11,"engage":11,"partneronly":11,"section":11,"websitepremier":8,"consulting":18,"partnersfeatured":6,"partnerscloudnexa":8,"governmenttrend":8,"enterpriseclass":9,"optimized":10,"awssmartronix":8,"delivering":9,"innovative":10,"agile":10,"technology":10,"solutionsentire":3,"entire":8,"amis":8,"articles":29,"tutorials":29,"product":21,"information":42,"case":14,"studies":14,"customer":35,"developer":18,"documentation":43,"public":17,"sets":14,"release":14,"notes":14,"sample":14,"code":16,"librariesdevelopers":2,"documentationsdks":7,"downloadsplatforms":7,"java":14,"javascript":14,"php":14,"ruby":14,"python":14,"netresources":7,"forums":15,"whitepapers":16,"training":7,"certification":7,"groupssupport":3,"centerforums":6,"technical":7,"faqs":14,"health":18,"dashboard":14,"plans":14,"contact":14,"usenglish":0,"upenglish":2,"credentialsmy":0,"consoleaws":4,"credentialsaws":1,"credentials":7,"consolemy":0,"accountmy":0,"accountbilling":0,"managementbilling":1,"managementsecurity":1,"credentialssecurity":1,"usaws":1,"computingaws":0,"networkingcompute":0,"networkingstorage":0,"cdnstorage":1,"servicesapplication":0,"servicesdeployment":0,"softwareaws":0,"educationgovernment":1,"hpc":14,"appsdigital":0,"marketingbusiness":0,"applicationsbackup":1,"drbig":0,"what":14,"awswhat":0,"choosing":6,"checklist":1,"checklistchoosing":0,"global":6,"world":1,"worldglobal":0,"stories":6,"storiescustomer":1,"whats":13,"new":13,"newwhats":1,"coverage":6,"coveragemedia":1,"analyst":8,"reports":8,"reportsanalyst":1,"events":12,"eventsevents":0,"videosvideos":0,"blog":20,"engineers":16,"engineersaws":0,"economics":15,"economicsfind":0,"cloudlearn":1,"securitylearn":0,"applicationslearn":0,"architecturelearn":0,"awscompute":0,"auto":6,"scaling":6,"scalingauto":1,"balancing":21,"balancingelastic":1,"resources":8,"dns":1,"dnsamazon":0,"freeget":13,"includesaws":13,"includes":13,"hoursaws":1,"volumes":1,"volumesamazon":0,"transfer":1,"gb30":0,"gbaws":8,"servicedatabase":0,"postgresql":1,"gb100":0,"mb5":0,"units10":0,"unitsaws":0,"serviceanalytics":0,"framework":1,"processing":1,"processingamazon":0,"workflows":1,"workflowsaws":0,"streaming":1,"components":1,"transcoding":0,"transcodingamazon":0,"requests100000":0,"interface":1,"controls":1,"tracking":10,"trackingaws":0,"monitoring":9,"monitoringamazon":0,"container":1,"creation":1,"compliance":0,"metrics10":0,"alarms1m":0,"requestsaws":0,"debianorgpartner":0,"infrastructure":14,"stacks":15,"stacksapplication":1,"operating":7,"systemsoperating":2,"databases":8,"cachingdatabases":1,"intelligence":8,"collaboration":7,"managementcontent":1,"crm":1,"crmcrmdeveloper":0,"issue":30,"trackingissue":1,"control":8,"controlsource":1,"testing":1,"testingtesting":0,"featured":1,"debianorgfeatured":0,"controllercitrix":0,"controller":0,"platinumgartner":0,"awsjaspersoft":0,"analyticscommercial":0,"debianorgdebian":0,"debianorg":0,"debian":0,"problemsstartups":1,"awsstartup":1,"cloudweb":2,"problems":3,"problemsbig":2,"compute750":7,"hoursstorage30":7,"gb5":7,"gbsql":7,"database750":7,"hours20":7,"costsenterprises":1,"cloudbusiness":0,"time":3,"timebackup":1,"costseconomics":0,"workloadsgovernment":1,"agency":1,"agencyfederal":0,"state":6,"governmentstate":2,"educationfacilitate":1,"workloadsaws":0,"growth":1,"growthsocial":0,"gaming":6,"games":1,"gamesgaming":0,"contentmedia":0,"ecommerce":6,"stores":1,"storesecommerce":0,"cloudmobile":0,"clouddigital":1,"serverbusiness":0,"cloudenterprise":0,"oracleoracle":1,"hyperion":1,"saprapid":1,"objectssaprapid":0,"microsoftwindows":1,"retentionbackup":0,"disaster":8,"disasterdisaster":0,"archiving":6,"retention":0,"retentionarchiving":0,"partnersaws":5,"projects":1,"projectsfind":0,"join":6,"program":1,"programjoin":0,"login":6,"website":1,"websitelogin":0,"premier":6,"partnerspremier":1,"solutionsfeatured":0,"governmentcloudnexa":0,"cloudnexacloud":0,"awstrend":0,"trend":0,"solutionssmartronix":0,"librariesentire":3,"libraries":2,"siteamis":0,"marketplacearticles":1,"tutorialsaws":1,"informationcase":1,"studiescustomer":1,"appsdeveloper":1,"setsrelease":1,"notespartnerssample":1,"developers":7,"usdevelopers":0,"groupsdevelopers":0,"developersaws":0,"groupsaws":2,"groups":2,"toolsget":0,"startedget":0,"netwindows":0,"articlestutorials":0,"articlesaws":0,"marketplaceaws":14,"certificationaws":0,"ussupport":2,"supportsupport":0,"center":29,"centersupport":0,"faqstechnical":0,"faqsservice":0,"dashboardservice":1,"dashboardaws":0,"plansaws":0,"planscontact":0,"uscontact":0,"usamis":0,"librariesaws":1,"whitepaperscompute":2,"workspaces":4,"vpc":4,"connect":4,"marketplacestorage":3,"glacier":4,"importexport":4,"gateway":4,"cloudfront":18,"marketplacedatabase":3,"elasticache":4,"redshift":9,"emr":4,"kinesis":4,"pipeline":4,"appstream":4,"cloudsearch":4,"swf":4,"ses":4,"fps":4,"transcoder":4,"iam":4,"cloudtrail":4,"beanstalk":11,"cloudformation":4,"opsworks":18,"cloudhsmaws":3,"crmdeveloper":4,"testingstartups":2,"challenge":4,"dataenterprises":2,"centergovernment":2,"regionweb":2,"marketplacedigital":3,"marketplacebusiness":3,"microsoft":4,"marketplacebackup":3,"marketplacebig":3,"portal":4,"partnersamis":0,"librariesamis":4,"whitepapersaws":0,"computingchoosing":0,"platformchoosing":0,"platformglobal":0,"supportaws":0,"marketplacecompute":0,"ec2amazon":1,"ec2auto":0,"workspacesamazon":1,"vpcamazon":1,"connectaws":1,"s3amazon":1,"glacieramazon":1,"ebsamazon":0,"ebsaws":0,"importexportaws":1,"gatewayaws":0,"gatewayamazon":0,"cloudfrontamazon":0,"cloudfrontaws":0,"rdsamazon":1,"dynamodbamazon":1,"elasticacheamazon":1,"redshiftamazon":1,"redshiftaws":1,"emramazon":1,"kinesisamazon":0,"kinesisaws":0,"pipelineaws":0,"pipelineamazon":0,"appstreamamazon":1,"cloudsearchamazon":1,"swfamazon":1,"sqsamazon":1,"sesamazon":1,"snsamazon":1,"fpsamazon":1,"transcoderamazon":0,"transcoderaws":0,"cloudhsmdeployment":0,"cloudhsm":1,"iamaws":1,"cloudtrailaws":0,"cloudtrailamazon":0,"cloudwatchamazon":0,"cloudwatchaws":0,"cloudformationaws":1,"opsworksaws":1,"testingaws":0,"crmbusiness":0,"managementcrmcrm":0,"testingdeveloper":0,"datastartups":0,"challengestartup":0,"challengeweb":0,"socialweb":0,"socialbig":0,"databig":0,"centerenterprises":0,"awsbusiness":0,"storagebackup":0,"storagesecurity":0,"centersecurity":2,"centereconomics":2,"regiongovernment":0,"region":1,"educationfederal":0,"governmentfederal":0,"regionaws":0,"marketplaceweb":0,"awssocial":1,"awsgaming":1,"awsmedia":1,"awsecommerce":1,"awsmobile":3,"marketingmarketing":0,"websitesmarketing":0,"websitesaws":0,"awsenterprise":0,"awsbackup":0,"awsdisaster":1,"awsarchiving":1,"awsbig":0,"awshpc":1,"partnersjoin":0,"networkjoin":0,"networklogin":0,"portallogin":0,"portalpremier":0,"updated":14,"address":7,"openssl":28,"vulnerability":7,"requirescripts":5,"function":5,"awscomponenttitle":5,"april":4,"have":34,"reviewed":6,"impact":6,"described":20,"cve20140160":20,"also":6,"known":6,"as":27,"heartbleed":20,"exception":6,"listed":6,"below":13,"we":53,"either":6,"determined":6,"were":13,"unaffected":6,"been":13,"able":6,"apply":6,"mitigations":6,"do":6,"not":6,"require":6,"actionelastic":6,"can":13,"confirm":6,"balancers":6,"affected":20,"if":6,"are":32,"terminating":6,"ssl":34,"connections":6,"balancer":6,"no":6,"longer":6,"vulnerable":6,"an":29,"added":20,"precaution":20,"recommend":20,"rotate":20,"certificates":20,"using":20,"provided":13,"customers":13,"own":6,"images":13,"should":6,"update":20,"order":6,"themselves":6,"links":6,"instructions":6,"several":6,"popular":6,"offerings":6,"be":6,"found":6,"secrets":6,"keys":6,"eg":6,"used":6,"processamazon":6,"hat":6,"opsworksmanaged":6,"updatedependencies":6,"command":6,"pick":6,"latest":6,"packages":6,"ubuntu":6,"newly":6,"created":6,"will":6,"install":6,"updates":6,"boot":6,"default":6,"please":6,"see":6,"working":6,"small":6,"number":6,"assist":6,"them":6,"updating":6,"enabled":6,"single":6,"instance":6,"this":13,"bugamazon":5,"mitigated":6,"accountaws":3,"twitter":6,"facebook":6,"google":6,"rssaws":3,"press":6,"releases":6,"legaldeveloper":4,"net":8,"sdks":6,"groupsdeveloper":6,"centers":6,"discussion":6,"supportmanage":5,"personal":6,"method":6,"request":6,"limit":8,"increasesamazon":2,"hiring":8,"dynamic":4,"growing":4,"unit":4,"within":4,"amazoncom":10,"currently":4,"development":4,"managers":9,"solution":4,"architects":4,"designers":4,"visit":4,"our":9,"careers":9,"page":9,"developerspecific":4,"equal":4,"opportunity":4,"employer":3,"companylanguage":2,"terms":3,"privacy":3,"inc":3,"its":3,"affiliates":3,"rights":3,"reservedaws":0,"bugaws":0,"beanstalkamazon":0,"reservedcreate":0,"rsscreate":0,"rss":1,"companyaws":0,"increasesaws":1,"legalaws":0,"legal":0,"computingcustomer":0,"successcustomer":0,"successeconomics":0,"centerarchitecture":1,"releasespress":0,"releasesanalyst":0,"awsjava":0,"awsjavascript":1,"awsphp":1,"awspython":1,"awsruby":1,"awswindows":1,"awssdks":0,"toolssdks":0,"toolsaws":0,"marketplaceuser":0,"groupsuser":0,"supportdeveloper":0,"centerssupport":0,"planssupport":0,"plansservice":0,"dashboarddiscussion":0,"forumsdiscussion":0,"tutorialsarticles":0,"tutorialscontact":0,"supportcontact":0,"increasesmanage":0,"increases":1,"manage":0,"accountmanagement":0,"consolemanagement":0,"consolebilling":0,"managementpersonal":0,"informationpersonal":0,"informationpayment":0,"methodpayment":0,"methodaws":0,"credentialsrequest":0,"increasesrequest":0,"company":0,"hiringamazon":1,"careersamazon":0,"employeran":0,"companyan":0,"language":1,"reservedsite":0,"termsprivacy":0,"scripts":0},"wordcount":22268}

// var docList = [dummyDoc1, dummyDoc2, dummyDoc3];
var docList = [rd1, rd2, rd3];

// creates the query to insert a doc
// returns an obj with the query and its request id {query: query, reqID: reqID}
var insertDocBatch = function (doc, reqID) {
  reqID = reqID || 0;
  var cmd = {};
  cmd.method = "POST";
  cmd.to = "/node";
  cmd.id = reqID;
  cmd.body = {
    "title" : doc.title,
    "url"   : doc.url
  };
  return {cmd: cmd, reqID: reqID};
};

var insertWordBatch = function (word, reqID) {
  reqID = reqID || 0;
  var cmd = {};

  cmd.method = "POST";
  cmd.to = "/node";
  cmd.id = reqID;
  cmd.body = {
    "word" : word
  };

  return {cmd: cmd, reqID: reqID};
};

var addLabelBatch = function (label, nodeID, reqID) {
  var cmd = {};
  cmd.method = "POST";
  cmd.id = reqID;
  cmd.to = "{" + nodeID +"}/labels"
  cmd.body = [label];

  return {cmd: cmd, reqID: reqID};
};

var createRelationshipBatch = function (docID, wordID, reqID, isInMasterDict) {
  var toDoc = "{" + docID + "}/relationships";
  var toNodeRel;

  // if the word was 
  if (isInMasterDict) {
    toNodeRel = "" + wordID;
  } else {
    toNodeRel = "{" + wordID +"}";
  }

  reqID = reqID || 0;
  var cmd = {};

  cmd.method = "POST";
  cmd.to = toDoc;
  cmd.id = reqID;
  cmd.body = {
    to: toNodeRel,
    data: {
      TF : 123
    },
    type: "HAS"
  };
  return {cmd: cmd, reqID: reqID};
};

var updateRelationshipIndexBatch = function (relationshipID, reqID) {
  var cmd = {};
  cmd.id = reqID;
  cmd.method = "POST";
  cmd.to = "/index/relationship/my_rels";
  cmd.body = {
    uri : "{" + relationshipID + "}",
    key : "TF",
    value : 123
  };
  return {cmd: cmd, reqID: reqID };
};

var batchInsert = function (doc, requestID, num) {
  requestID = requestID || 0;
  var query = [];

  // initial step is to create a command to insert the doc
  // *note* every command is a new request so ID has to be updated
  var docCMD = insertDocBatch(doc, requestID);
  query.push(docCMD.cmd);
  requestID++;

  // add label to Doc
  var labelCMD = addLabelBatch("Document", docCMD.reqID, requestID);
  query.push(labelCMD.cmd);
  requestID++

  // iterate through words and create queries in order
  for (var word in doc.wordtable) {
    // if word is not in list, insert word node first THEN create relationship
    if (masterDict[word] === undefined) {
      var wordCMD = insertWordBatch(word, requestID);
      query.push(wordCMD.cmd);
      requestID++;

      // add word to list of words to be added to master dict after batch op. complete
      wordsToAdd.push({word: word, reqID: wordCMD.reqID});

      // add a label to the word
      var labelCMD = addLabelBatch("Word", wordCMD.reqID, requestID);
      query.push(labelCMD.cmd);
      requestID++

      // create relationship
      var relCMD = createRelationshipBatch(docCMD.reqID, wordCMD.reqID, requestID);
      query.push(relCMD.cmd);
      requestID++;

      // update relationship index
      var relIndexCMD = updateRelationshipIndexBatch(relCMD.reqID, requestID);
      query.push(relIndexCMD.cmd);
      requestID++;

    // else word exists in the master dict, so create relationships from that
    } else {
      // find the word's node from masterDict and create a relationship
      var wordNodeNum = masterDict[word].nodeNum;
      var relCMD = createRelationshipBatch(docCMD.reqID, wordNodeNum, requestID, true);
      query.push(relCMD.cmd);
      requestID++;

      // update the relationship index
      var relIndexCMD = updateRelationshipIndexBatch(relCMD.reqID, requestID);
      query.push(relIndexCMD.cmd);
      requestID++;
    }

  }
  consoleStart(query, "Batch Insert Query " + num);
  return {query: query, reqID: requestID};
};

// updates the master dictionary on the server side
var updateDict = function (newWords, result, num) {
  num = num || 0;
  for (var i = 0; i < newWords.length; i++) {
    var word = newWords[i].word;
    var id = newWords[i].reqID;
    var resultObj = result[id];
    var loc = resultObj.location;
    var nodeNum = getNodeNum(loc);
    masterDict[word] = {};
    masterDict[word].word = word;
    masterDict[word].nodeNum = nodeNum; 
    masterDict[word].loc = loc;
  }
  consoleStart(masterDict, "Newly added words " + num);
  // empty the words to be added
  wordsToAdd = [];
  return masterDict;
};

// recursive function that inserts docs only when the previous document has been inserted
var insertBatchRec = function (result, response, documentList, num) {
  if (documentList.length === 0) { return; }
  consoleStart(result, "Result after " + num + " insert");
  updateDict(wordsToAdd, result, num);
  var doc = documentList.pop();
  rest.postJson(batchURL, batchInsert(doc, 0, num+1).query)
    .on("complete", function (result, response) {
      insertBatchRec(result, response, documentList, ++num);
    });
};

// clear data base first for testing purposes
rest.postJson(cypherURL, clearQuery()).on("complete", function (result, response) {
  // query database to create master dictionary
  rest.postJson(cypherURL, masterDictQuery())
    .on("complete", function (result, response) {
      // create a dictionary first after querying
      addToDict(result, masterDict);

      insertBatchRec(result, response, docList, 0);

    });
});




// replacement for recursive batch insert function
      // // batch operation to insert document and its relationship with words
      // rest.postJson(batchURL, batchInsert(dummyDoc1).query)
      //   .on("complete", function (result, response) {
      //     consoleStart(result, "RESULT after first batch insert");
      //     updateDict(wordsToAdd, result);

      //     rest.postJson(batchURL, batchInsert(dummyDoc2).query)
      //       .on("complete", function (result, response){
      //         consoleStart(result, "RESULT after SECOND batch insert");
      //       });
      //   });

// REFERENCE
/*
  http://localhost:7474/db/data/index/relationship/MyIndex/?uniqueness=get_or_create
  {
    "key" : "name",
    "value" : "Greg",
    "start" : "http://127.0.0.1:7474/db/data/node/49",
    "end" : "http://127.0.0.1:7474/db/data/node/48",
    "type" : "tf"
}
*/
